let isDebugAll = true;

function getInfo(auth, callback) {
	let host = 'https://iotdev.clz.me';
	let url = '/api/v1/user/device/diy/auth?authKey=' + auth;
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
			} else {
				let dd=data['detail'];
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
				callback(mProto)
			}
		})
	}).on('error', function(err) {
		console.log('Get Device Info Error...' + err);
	})
}
getInfo("1f844d0eeef9", function(mProto) {
	var mqtt = require('mqtt');
	var options = {
		clientId: mProto._clientId,
		username: mProto._username,
		password: mProto._password,
	}
	var client = mqtt.connect('mqtt://' + mProto._host + ':' + mProto._port, options);
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
		if (isDebugAll) {
			console.log('MQTT:<-|', data);
		}
		let get_msg = JSON.parse(data);

		data = JSON.stringify(get_msg['data']);
		let from_device = get_msg.fromDevice
		console.log('from_device:', from_device)
		switch (from_device) {
			case 'MIOT':
			let pState="false";
				let send_msg = {
					"data": {
						"pState": pState
					},
					"fromDevice": mProto._deviceName,
					"toDevice": "MIOT_r",
					"deviceType": "vAssistant"
				}
				if (isDebugAll) {
					console.log('状态反馈给小米')
					console.log('MQTT:->|', JSON.stringify(send_msg));
					console.log(data)
				}
				client.publish(mProto._pubtopic, JSON.stringify(send_msg));
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
							console.log('MQTT:->|', JSON.stringify(send_msg));
						}
						client.publish(mProto._pubtopic, JSON.stringify(send_msg));
						break;
					default:
						console.log(data);
						break;
				}
				break;
		}
		// client.end()

	})
	client.on('error', function(err) {
		console.log(err);
	})
})