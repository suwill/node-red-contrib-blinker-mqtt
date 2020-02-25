# node-red-contrib-blinker-mqtt
put Blinker(www.diandeng.tech) Mqtt message to Node-Red
## BlinkerAPP接入(node-red-contrib-blinker-mqtt)
    接入BlinkerAPP中的设备到Node-RED
	业余时间开发，欢迎入群交流（776817275）
<<<<<<< HEAD
##示例：
=======
示例：
```[
    {
        "id": "1313b40e.c78bec",
        "type": "tab",
        "label": "流程1",
        "disabled": false,
        "info": ""
    },
    {
        "id": "ff575f0c.08978",
        "type": "debug",
        "z": "1313b40e.c78bec",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "x": 770,
        "y": 240,
        "wires": []
    },
    {
        "id": "f4f255f2.968c18",
        "type": "Blinker-OUT",
        "z": "1313b40e.c78bec",
        "x": 590,
        "y": 300,
        "wires": [
            [
                "ff575f0c.08978"
            ]
        ]
    },
    {
        "id": "9055dac5.db8908",
        "type": "inject",
        "z": "1313b40e.c78bec",
        "name": "",
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "x": 270,
        "y": 300,
        "wires": [
            [
                "8a13d37.e59833"
            ]
        ]
    },
    {
        "id": "29edd127.0df7ee",
        "type": "Blinker-IN",
        "z": "1313b40e.c78bec",
        "SecretKey": "87ec828ea4f7",
        "DeviceType": "multi_outlet",
        "autoRes": "false",
        "x": 260,
        "y": 240,
        "wires": [
            [
                "ff575f0c.08978"
            ]
        ]
    },
    {
        "id": "8a13d37.e59833",
        "type": "function",
        "z": "1313b40e.c78bec",
        "name": "状态反馈",
        "func": "msg.send=true;//没有则不发MQTT\nmsg.payload={\n    \"pState\": \"false\"\n}\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 440,
        "y": 300,
        "wires": [
            [
                "f4f255f2.968c18"
            ]
        ]
    }
]
```
