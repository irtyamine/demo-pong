#ifndef __BLE_MIDI_H_
#define __BLE_MIDI_H_

void midi_service_init(uint16_t app_id);
void midi_service_gatts_event_handler(esp_gatts_cb_event_t event, esp_gatt_if_t gatts_if, esp_ble_gatts_cb_param_t *param);

#endif // __BLE_MIDI_H_
