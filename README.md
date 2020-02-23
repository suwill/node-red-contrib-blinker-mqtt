# node-red-contrib-blinker-mqtt
put Blinker(www.diandeng.tech) Mqtt message to Node-Red
# BlinkerAPP接入(node-red-contrib-blinker-mqtt)
    接入BlinkerAPP中的设备到Node-RED
	业余时间开发，欢迎入群交流（301438087）

* 流程

``` json
	[{"id":"ac5c3ad5.980c28","type":"tab","label":"点灯一下","disabled":false,"info":""},{"id":"84c89da1.90286","type":"Blinker","z":"ac5c3ad5.980c28","SecretKey":"1f844d0eeef9","x":270,"y":240,"wires":[["abb572f6.b8b6e"]]},{"id":"abb572f6.b8b6e","type":"debug","z":"ac5c3ad5.980c28","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":510,"y":240,"wires":[]}]
```
