module.exports = function(RED) { // RED  可以对node-red 进行访问
	var Blinker_key = '';
	var client = undefined;
	var fromDevice = '';
	RED.nodes.registerType("Blinker-IN", class {
		constructor(config) {
			const node = this
			RED.nodes.createNode(node, config)
			Blinker_key = config.SecretKey;
			var nodeContext = this.context();
			var flowContext = this.context().flow;
			flowContext.set(Blinker_key, {
				type: config.DeviceType
			})
			// console.log('读取数值：', flowContext.get(Blinker_key).action || '{"pState": "false"}')
			var mqtt = require('mqtt');
			// console.log("SecretKey:", Blinker_key)
			let isDebugAll = true;

			function getBlinkerDeviceInfo(auth, callback) {
				let host = 'https://iotdev.clz.me';
				let url = '';
				if (config.DeviceType != 'other') {
					url = '/api/v1/user/device/diy/auth?authKey=' + auth + '&miType=' + config.DeviceType + '&version=1.2.2';
				} else {
					url = '/api/v1/user/device/diy/auth?authKey=' + auth;
				}
				let https = require('https');
				https.get(host + url, function(res) {
					let datas = [];
					let size = 0;
					res.on('data', function(data) {
						datas.push(data);
						size += data.length;
					})
					res.on('end', function(data) {
						let mProto = {};
						let buff = Buffer.concat(datas, size);
						var data = JSON.parse(buff);
						if (data['detail'] == 'device not found') {
							console.log('Please make sure you have put in the right AuthKey!');
							// node.warn('没有找到设备,AuthKey错误?')
							node.status({
								text: `没有找到设备,AuthKey错误?`,
								fill: 'red',
								shape: 'ring'
							})
						} else {
							node.status({
								text: `获取设备成功:${Blinker_key}`,
								fill: 'green',
								shape: 'ring'
							})
							let dd = data['detail'];
							// console.log('device found');
							let deviceName = dd.deviceName;
							let iotId = dd.iotId;
							let iotToken = dd.iotToken;
							let productKey = dd.productKey;
							let uuid = dd.uuid;
							let broker = dd.broker;

							if (broker == 'aliyun') {
								mProto._host = 'public.iot-as-mqtt.cn-shanghai.aliyuncs.com'
								mProto._port = 1883;
								mProto._subtopic = '/' + productKey + '/' + deviceName + '/r';
								mProto._pubtopic = '/' + productKey + '/' + deviceName + '/s';
								mProto._clientId = deviceName;
								mProto._username = iotId;
							} else if (broker == 'qcloud') {
								mProto._host = 'iotcloud-mqtt.gz.tencentdevices.com'
								mProto._port = 1883;
								mProto._subtopic = productKey + '/' + deviceName + '/r'
								mProto._pubtopic = productKey + '/' + deviceName + '/s'
								mProto._clientId = productKey + deviceName
								mProto._username = mProto._clientId + ';' + iotId
							}
							mProto._deviceName = deviceName
							mProto._password = iotToken
							mProto._uuid = uuid
							flowContext.set(config.SecretKey, {
								type: config.DeviceType,
								mqtt: mProto
							})
							node.send({
								payload: "NodeRed<-Blinker->MQTT OK"
							})
							callback(mProto)
						}
					})
				}).on('error', function(err) {
					console.log('Get Device Info Error...' + err);
					node.status({
						text: `获取设备失败:${err}`,
						fill: 'red',
						shape: 'ring'
					})
				})
			}
			getBlinkerDeviceInfo(config.SecretKey, function(mProto) {
				var options = {
					clientId: mProto._clientId,
					username: mProto._username,
					password: mProto._password,
				}
				client = mqtt.connect('mqtt://' + mProto._host + ':' + mProto._port, options);
				client.on('connect', function() {
					client.subscribe(mProto._subtopic);
					console.log('//////////--------------MQTT:<->Connected!--------------//////////');
				})
				client.on('message', function(topic, message) {
					var data = message.toString(); // message is Buffer
					// node.send([JSON.parse(data), null])
					if (isDebugAll) {
						console.log('MQTT:<-|', data);
					}
					let get_msg = JSON.parse(data);
					data = JSON.stringify(get_msg['data']);
					fromDevice = get_msg.fromDevice;

					if (fromDevice == 'MIOT') {
						//米家设备
						// let queryDevice = JSON.parse(data)
						if (data == '{"get":"state"}') {
							console.log('//获取整个插排的状态:', data)
							// if (get_msg.data.hasOwnProperty('get') && get_msg.data.get == 'state') {
							// let out_parm = nodeContext.get('MIOT-Device') || '{"pState": "false"}';
							if (config.autoRes) {
								let out_parm = flowContext.get(config.SecretKey).action || '{"pState": "false"}';
								console.log(out_parm)
								// 小米状态查询包
								client.publish(mProto._pubtopic, JSON.stringify({
									"data": JSON.parse(out_parm),
									"fromDevice": mProto._deviceName,
									"toDevice": "MIOT_r",
									"deviceType": "vAssistant"
								}));
							} 
							node.send({
								payload: JSON.parse(data)
							})
							// console.log('////心跳包发完了')
						} else if (get_msg.data.hasOwnProperty('get') && get_msg.data.get == 'state' && get_msg.data.num) {
							console.log('<-|获取状态包:', data)
							node.send({
								payload: JSON.parse(data)
							})
							// let out_parm = nodeContext.get('MIOT-Device') || '{"pState": "false"}';
							// let out_parm = flowContext.get(config.SecretKey).action || '{"pState": "false"}';
							// client.publish(mProto._pubtopic, JSON.stringify({
							// 	"data": JSON.parse(out_parm),
							// 	"fromDevice": mProto._deviceName,
							// 	"toDevice": "MIOT_r",
							// 	"deviceType": "vAssistant"
							// }));
							// console.log('不知道干没干')
						} else if (get_msg.data.hasOwnProperty('set')) {
							console.log('MQTT:<-|操控指令包:', data)
							// {"set":{"pState":true,"num":"1"}}
							// console.log(JSON.parse(data).set)
							//原样怼回去了
							if (config.autoRes) {
								let in_parm = JSON.stringify(JSON.parse(data).set);
								nodeContext.set('MIOT-Device', in_parm)
								// console.log(in_parm)
								client.publish(mProto._pubtopic, JSON.stringify({
									"data": JSON.parse(in_parm),
									"fromDevice": mProto._deviceName,
									"toDevice": "MIOT_r",
									"deviceType": "vAssistant"
								}));
							}
							//原样怼回去了
							console.log('//////////--------------米家设备:操控指令', data)
							node.send({
								payload: JSON.parse(data)
							})
						} else {
							console.log('其他情况:', data)
						}
					} else {
						//非米家设备
						if (get_msg.data.hasOwnProperty('get') && get_msg.data.get == 'state') {
							//APP心跳包
							client.publish(mProto._pubtopic, JSON.stringify({
								"data": {
									"state": "online",
									"timer": "000",
									"version": "0.1.0"
								},
								"fromDevice": mProto._deviceName,
								"toDevice": mProto._uuid,
								"deviceType": "OwnApp"
							}));
						} else {
							//非心跳包抛向前台
							console.log('//////////--------------非米家设备:非心跳包', data)
							node.send({
								payload: JSON.parse(data)
							})
						}
					}
				})
				client.on('error', function(err) {
					console.log(err);
				})
				node.on('input', msg => {
					console.log('INPUT---------', msg.sendMqtt)
					if (msg.sendMqtt) {
						console.log(mProto);
						console.log(msg.payload);
						mProto._flag = "SendToBlinkerMqtt";
						node.send({
							payload: mProto
						});
						delete mProto._flag;
						node.send(msg);
						client.publish(mProto._pubtopic, JSON.stringify(msg.payload));
					}
				})
			})
			node.on('close', function(removed, done) {
				client.end();
				done();
			});
			// const xiaomiConfig = RED.nodes.getNode(config.Blinker)
			node.on('input', data => {
				console.log('data:', data)
			})
		}
	});
	RED.nodes.registerType('Blinker-OUT', class {
		constructor(config) {
			const node = this
			RED.nodes.createNode(node, config)
			// console.log('Blinker_key:', Blinker_key)
			var flowContext = this.context().flow;
			node.on('input', data => {
				if (data.hasOwnProperty('send')) {
					let mqtt = flowContext.get(Blinker_key).mqtt;
					// console.log(mqtt._pubtopic)
					node.status({
						text: JSON.stringify(data.payload),
						fill: 'green',
						shape: 'ring'
					})
					let send_msg={
						"data": data.payload,
						"fromDevice": mqtt._deviceName,
						"toDevice": fromDevice == 'MIOT' ? "MIOT_r" : mqtt._uuid,
						"deviceType": fromDevice == 'MIOT' ? "vAssistant" : "OwnApp"
					}
					node.send({payload:send_msg})
					client.publish(mqtt._pubtopic, JSON.stringify(send_msg));
					console.log('MQTT:->|', JSON.stringify(send_msg));
				} else{
					node.status({
						text: '因msg.send==undefined而未发布',
						fill: 'red',
						shape: 'ring'
					})
					node.send({payload:data})
				}
				
			})
		}
	})
}
