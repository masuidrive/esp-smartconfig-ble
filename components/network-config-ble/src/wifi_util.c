#include "network-config-ble-internal.h"
static const char *TAG = "NCB WIFI";

#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAILED_BIT BIT1
static EventGroupHandle_t _wifi_event_group = NULL;

static esp_event_handler_instance_t _instance_any_id = NULL;
static esp_event_handler_instance_t _instance_got_ip = NULL;
static ncb_wifi_status_callback _status_callback = NULL;
static enum ncb_wifi_status _wifi_status = NCB_WIFI_NONE;
static int _max_retry = 0;
static int _retry_num = 0;

static void _wifi_event_handler(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data) {
  if (event_base == WIFI_EVENT) {
    if (event_id == WIFI_EVENT_STA_START) {
      esp_wifi_connect();
    } else if (event_id == WIFI_EVENT_STA_DISCONNECTED) {
      ESP_LOGI(TAG, "connect to the AP fail: %d", _max_retry);

      if (_retry_num < _max_retry || _wifi_status == NCB_WIFI_CONNECTED || _wifi_status == NCB_WIFI_RECONNECTING) {
        if (_status_callback)
          _status_callback(_wifi_status = NCB_WIFI_RECONNECTING);
        esp_wifi_connect();
        _retry_num++;
        ESP_LOGI(TAG, "retry to connect to the AP: %d / %d", _retry_num, _max_retry);
      } else {
        if (_status_callback)
          _status_callback(_wifi_status = NCB_WIFI_DISCONNECTED);
        if (_wifi_event_group)
          xEventGroupSetBits(_wifi_event_group, WIFI_FAILED_BIT);
      }
    }
  } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
    ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
    ESP_LOGI(TAG, "got ip:" IPSTR, IP2STR(&event->ip_info.ip));
    _retry_num = 0;
    if (_status_callback)
      _status_callback(_wifi_status = NCB_WIFI_CONNECTED);
    if (_wifi_event_group)
      xEventGroupSetBits(_wifi_event_group, WIFI_CONNECTED_BIT);
  }
}

static esp_err_t _wifi_setup(const char *ssid, const char *password) {
  wifi_config_t wifi_config = {
      .sta =
          {
              .threshold =
                  {
                      .authmode = WIFI_AUTH_WPA2_PSK,
                  },
              .pmf_cfg = {.capable = true, .required = false},
          },
  };
  if (strlen(password) == 0) {
    wifi_config.sta.threshold.authmode = WIFI_AUTH_OPEN;
  }

  strlcpy((char *)wifi_config.sta.ssid, ssid, sizeof(wifi_config.sta.ssid));
  strlcpy((char *)wifi_config.sta.password, password, sizeof(wifi_config.sta.password));

  _CATCH_ESP_FAIL(esp_wifi_set_config(ESP_IF_WIFI_STA, &wifi_config), "esp_wifi_set_config");
  _CATCH_ESP_FAIL(esp_wifi_start(), "esp_wifi_start");

  return ESP_OK;

esp_failed:
  return ESP_FAIL;
}

esp_err_t ncb_wifi_connect(const char *ssid, const char *password, int max_retry,
                           ncb_wifi_status_callback status_callback) {
  _max_retry = max_retry;
  _status_callback = status_callback;
  _retry_num = 0;
  ESP_LOGI(TAG, "connect SSID: %s, %s", ssid, password);

  _CATCH_ESP_FAIL(esp_wifi_stop(), "esp_wifi_stop");

  if (_status_callback)
    _status_callback(_wifi_status = NCB_WIFI_CONNECTING);

  // set event handler
  _wifi_event_group = xEventGroupCreate();

  // init wifi config
  _CATCH_ESP_FAIL(_wifi_setup(ssid, password), "_wifi_setup");

  // wait wifi_event_handler task
  EventBits_t bits =
      xEventGroupWaitBits(_wifi_event_group, WIFI_CONNECTED_BIT | WIFI_FAILED_BIT, pdFALSE, pdFALSE, portMAX_DELAY);

  vEventGroupDelete(_wifi_event_group);
  _wifi_event_group = NULL;

  if (bits & WIFI_CONNECTED_BIT) {
    ESP_LOGI(TAG, "connected to ap SSID: %s", ssid);
    return ESP_OK;
  } else if (bits & WIFI_FAILED_BIT) {
    ESP_LOGI(TAG, "Failed to connect to SSID: %s", ssid);
    _CATCH_ESP_FAIL(esp_wifi_stop(), "esp_wifi_stop");
    return ESP_FAIL;
  } else {
    ESP_LOGE(TAG, "UNEXPECTED EVENT");
    _CATCH_ESP_FAIL(esp_wifi_stop(), "esp_wifi_stop");
    return ESP_FAIL;
  }

  return ESP_OK;

esp_failed:
  return ESP_FAIL;
}

esp_err_t ncb_wifi_connect_with_nvs(int max_retry, ncb_wifi_status_callback status_callback) {
  nvs_handle_t nvs_handle;
  _CATCH_ESP_FAIL(nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs_handle), "nvs_open");

  size_t ssid_size = MAX_SSID_LEN, passphrase_size = MAX_PASSPHRASE_LEN;
  char ssid[MAX_SSID_LEN], password[MAX_PASSPHRASE_LEN];

  _CATCH_ESP_FAIL(nvs_get_str(nvs_handle, "ssid", ssid, &ssid_size), "nvs_get_str: ssid");
  _CATCH_ESP_FAIL(nvs_get_str(nvs_handle, "password", password, &passphrase_size), "nvs_get_str: password");

  nvs_close(nvs_handle);

  return ncb_wifi_connect(ssid, password, max_retry, status_callback);

esp_failed:
  nvs_close(nvs_handle);
  return ESP_ERR_NOT_FOUND; // NVS config not found
}

esp_err_t ncb_wifi_init() {
  _CATCH_ESP_FAIL(nvs_flash_init(), "nvs_flash_init");
  _CATCH_ESP_FAIL(esp_netif_init(), "esp_netif_init");
  esp_netif_create_default_wifi_sta();

  _CATCH_ESP_FAIL(
      esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &_wifi_event_handler, NULL, &_instance_any_id),
      "register WIFI_EVENT");
  _CATCH_ESP_FAIL(
      esp_event_handler_instance_register(IP_EVENT, ESP_EVENT_ANY_ID, &_wifi_event_handler, NULL, &_instance_got_ip),
      "register IP_EVENT");

  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  _CATCH_ESP_FAIL(esp_wifi_init(&cfg), "esp_wifi_init");
  _CATCH_ESP_FAIL(esp_wifi_set_storage(WIFI_STORAGE_FLASH), "WIFI_STORAGE_FLASH");
  _CATCH_ESP_FAIL(esp_wifi_set_mode(WIFI_MODE_STA), "WIFI_MODE_STA");

  return ESP_OK;

esp_failed:
  return ESP_FAIL;
}

esp_err_t ncb_wifi_disconnect() {
  esp_wifi_stop();
  _max_retry = -2;

  return ESP_OK;
}

bool ncb_wifi_is_connected() { return _wifi_status == NCB_WIFI_CONNECTED; }