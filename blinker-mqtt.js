module.exports = function(RED) { // RED  可以对node-red 进行访问
	function Blinker(config) {
		RED.nodes.createNode(this, config); // 节点本身就会对调用该函数，包括节点输入的属性
		const node = this;
		var nodeContext = this.context();
		var mqtt = require('mqtt');
		var client = undefined;
		console.log(config.SecretKey)
		let isDebugAll = true;

		function getBlinkerDeviceInfo(auth, callback) {
			let host = 'https://iotdev.clz.me';
			let url='';
			if (config.DeviceType!='other') {
				url = '/api/v1/user/device/diy/auth?authKey=' + auth + '&miType='+config.DeviceType+'&version=1.2.2';
			} else{
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
							text: `获取设备成功:${config.SecretKey}`,
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
						if (isDebugAll) {
							console.log('-------------------- GET OPTION FROM BLINKER --------------------')
							console.log('deviceName: ', deviceName);
							console.log('iotId: ', iotId);
							console.log('iotToken: ', iotToken);
							console.log('productKey: ', productKey);
							console.log('uuid: ', uuid);
							console.log('broker: ', broker);
						}
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
						if (isDebugAll) {
							console.log('-----------------------------------------------------------------')
							console.log('clientID: ', mProto._clientId);
							console.log('username: ', mProto._username);
							console.log('password: ', mProto._password);
							console.log('subtopic: ', mProto._subtopic);
							console.log('pubtopic: ', mProto._pubtopic);
							console.log('-----------------------------------------------------------------')
						}
						node.send({payload:mProto})
						node.send({payload:"NodeRed<-Blinker->MQTT OK~"})
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
				// var subtopic = '/' + mProto._productKey + '/' + mProto._clientId + '/r';
				client.subscribe(mProto._subtopic);
				// client.publish('presence', 'Hello mqtt')
				if (isDebugAll) {
					console.log('-----------------------------------------------------------------')
					console.log('//////////--------------MQTT:<->Connected!--------------//////////');
					console.log('-----------------------------------------------------------------')
				}
			})
			client.on('message', function(topic, message) {
				// message is Buffer
				var data = message.toString();
				// node.send([JSON.parse(data), null])
				if (isDebugAll) {
					console.log('MQTT:<-|', data);
				}
				let get_msg = JSON.parse(data);
				data = JSON.stringify(get_msg['data']);
				let from_device = get_msg.fromDevice
				console.log('from_device:', from_device)
				switch (from_device) {
					case 'MIOT':
						let queryDevice = JSON.parse(data)
						if (data == '{"get":"state"}') {
							if (isDebugAll) {
								console.log('//////////--------------米家设备:心跳包', data)
								// console.log('MQTT:->|', JSON.stringify(send_msg));
							} //
							let out_parm = nodeContext.get('MIOT-Device') || '{"pState": "false"}';
							console.log(out_parm)
							// 小米初次状态查询包
							client.publish(mProto._pubtopic, JSON.stringify({
								"data": JSON.parse(out_parm),
								"fromDevice": mProto._deviceName,
								"toDevice": "MIOT_r",
								"deviceType": "vAssistant"
							}));
							console.log('////心跳包发完了')
						} else if (queryDevice.num) {
							let out_parm = nodeContext.get('MIOT-Device') || '{"pState": "false"}';
							client.publish(mProto._pubtopic, JSON.stringify({
								"data": JSON.parse(out_parm),
								"fromDevice": mProto._deviceName,
								"toDevice": "MIOT_r",
								"deviceType": "vAssistant"
							}));

						} else {
							console.log('//////////-val')
							console.log(data)
							console.log(JSON.parse(data).set)
							let in_parm = JSON.stringify(JSON.parse(data).set);
							nodeContext.set('MIOT-Device', in_parm)
							console.log(in_parm)
							// node.send(JSON.parse(data))
							client.publish(mProto._pubtopic, JSON.stringify({
								"data": JSON.parse(in_parm),
								"fromDevice": mProto._deviceName,
								"toDevice": "MIOT_r",
								"deviceType": "vAssistant"
							}));
							console.log('//////////--------------米家设备:非心跳包', data)
							node.send({payload:JSON.parse(data)})
						}
						break;
					default:
						switch (data) {
							case '{"get":"state"}':
								let send_msg = {
									"data": {
										"state": "online",
										"timer": "000",
										"version": "0.1.0"
									},
									"fromDevice": mProto._deviceName,
									"toDevice": mProto._uuid,
									"deviceType": "OwnApp"
								}
								if (isDebugAll) {
									console.log('MQTT:->|', data);
								}
								client.publish(mProto._pubtopic, JSON.stringify(send_msg));
								console.log('//////////--------------非米家设备:APP心跳包', data)
								// node.send([send_msg, null])
								break;
							default:
								console.log('//////////--------------非米家设备:非心跳包', data)
								node.send({payload:JSON.parse(data)})
								break;
						}
						break;
				}
				// client.end()
			})
			client.on('error', function(err) {
				console.log(err);
			})
			node.on('input', msg => {
				console.log('INPUT---------', msg.sendMqtt)
				if (msg.sendMqtt) {
					console.log(mProto);
					console.log(msg.payload);
					mProto._flag="SendToBlinkerMqtt";
					node.send({payload:mProto});
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
	}
	RED.nodes.registerType("Blinker", Blinker);
}
