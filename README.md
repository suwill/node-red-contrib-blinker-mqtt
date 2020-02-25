# node-red-contrib-blinker-mqtt
put Blinker(www.diandeng.tech) Mqtt message to Node-Red
## BlinkerAPP接入(node-red-contrib-blinker-mqtt)
    接入BlinkerAPP中的设备到Node-RED
	业余时间开发，欢迎入群交流（776817275）
## 示例：
```[
    {
        "id": "1313b40e.c78bec",
        "type": "tab",
        "label": "小爱-Blinker-HA",
        "disabled": false,
        "info": ""
    },
    {
        "id": "f4f255f2.968c18",
        "type": "Blinker-OUT",
        "z": "1313b40e.c78bec",
        "x": 950,
        "y": 100,
        "wires": [
            []
        ]
    },
    {
        "id": "29edd127.0df7ee",
        "type": "Blinker-IN",
        "z": "1313b40e.c78bec",
        "SecretKey": "87ec828ea4f7",
        "DeviceType": "multi_outlet",
        "autoRes": "false",
        "x": 140,
        "y": 300,
        "wires": [
            [
                "6aa02509.ca23cc"
            ]
        ]
    },
    {
        "id": "bc6565d0.7b2f48",
        "type": "api-current-state",
        "z": "1313b40e.c78bec",
        "name": "状态查询",
        "server": "d686fe32.b6e34",
        "version": 1,
        "outputs": 2,
        "halt_if": "on",
        "halt_if_type": "str",
        "halt_if_compare": "is",
        "override_topic": false,
        "entity_id": "light.test_szdl",
        "state_type": "habool",
        "state_location": "payload",
        "override_payload": "msg",
        "entity_location": "data",
        "override_data": "msg",
        "blockInputOverrides": false,
        "x": 600,
        "y": 100,
        "wires": [
            [
                "b29eb377.77b0c"
            ],
            [
                "b29eb377.77b0c"
            ]
        ]
    },
    {
        "id": "6aa02509.ca23cc",
        "type": "switch",
        "z": "1313b40e.c78bec",
        "name": "查询还是执行",
        "property": "payload",
        "propertyType": "msg",
        "rules": [
            {
                "t": "hask",
                "v": "get",
                "vt": "str"
            },
            {
                "t": "hask",
                "v": "set",
                "vt": "str"
            },
            {
                "t": "else"
            }
        ],
        "checkall": "true",
        "repair": false,
        "outputs": 3,
        "x": 140,
        "y": 180,
        "wires": [
            [
                "c6e0de06.4a29d"
            ],
            [
                "21760ca9.8087b4"
            ],
            [
                "4f67b1a7.78ca1"
            ]
        ]
    },
    {
        "id": "b29eb377.77b0c",
        "type": "function",
        "z": "1313b40e.c78bec",
        "name": "当前状态",
        "func": "return {\n    send:true,\n    payload:{\n    pState:msg.payload,\n    num:1\n    }\n};",
        "outputs": 1,
        "noerr": 0,
        "x": 780,
        "y": 100,
        "wires": [
            [
                "f4f255f2.968c18"
            ]
        ]
    },
    {
        "id": "4f67b1a7.78ca1",
        "type": "debug",
        "z": "1313b40e.c78bec",
        "name": "",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "x": 410,
        "y": 240,
        "wires": []
    },
    {
        "id": "32d613be.2d7a9c",
        "type": "api-call-service",
        "z": "1313b40e.c78bec",
        "name": "开关控制",
        "server": "d686fe32.b6e34",
        "version": 1,
        "debugenabled": false,
        "service_domain": "light",
        "service": "toggle",
        "entityId": "",
        "data": "",
        "dataType": "json",
        "mergecontext": "",
        "output_location": "",
        "output_location_type": "none",
        "mustacheAltTags": false,
        "x": 600,
        "y": 180,
        "wires": [
            []
        ]
    },
    {
        "id": "21760ca9.8087b4",
        "type": "function",
        "z": "1313b40e.c78bec",
        "name": "开关匹配",
        "func": "var ids=[\n    \"light.test_szdl\",\n    \"light.test_szdl\",\n    \"light.test_szdl\"\n    ]\nreturn {\n    payload:{\n        domain:\"light\",\n        service: msg.payload.set.pState?\"turn_on\":\"turn_off\",\n        data:{\n            entity_id:ids[msg.payload.set.num]\n        }\n    }\n}\n",
        "outputs": 1,
        "noerr": 0,
        "x": 400,
        "y": 180,
        "wires": [
            [
                "32d613be.2d7a9c"
            ]
        ]
    },
    {
        "id": "c6e0de06.4a29d",
        "type": "function",
        "z": "1313b40e.c78bec",
        "name": "匹配开关id",
        "func": "let gds=[\n    \"light.test_szdl\",\n    \"light.test_szdl\",\n    \"light.test_szdl\"\n    ]\nreturn {\n    payload:{\n         entity_id:gds[msg.payload.get.num]\n   }\n}",
        "outputs": 1,
        "noerr": 0,
        "x": 410,
        "y": 100,
        "wires": [
            [
                "bc6565d0.7b2f48"
            ]
        ]
    },
    {
        "id": "d686fe32.b6e34",
        "type": "server",
        "z": "",
        "name": "Home Assistant@szdl",
        "legacy": false,
        "addon": false,
        "rejectUnauthorizedCerts": true,
        "ha_boolean": "y|yes|true|on|home|open",
        "connectionDelay": true,
        "cacheJson": true
    }
]
```
