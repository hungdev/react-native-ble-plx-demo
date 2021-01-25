import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { LogLevel } from 'react-native-ble-plx/src/TypeDefinition';
import { Buffer } from 'buffer';

export default class App extends Component {
  constructor(props) {
    super(props);

    //Starts the bluetooth manager         

    this.manager = new BleManager();
    this.manager.setLogLevel(LogLevel.Verbose);

    //Text for debugging actions 
    this.state = { actionResult: 'No Action yet...', deviceList: [] };
  }

  UNSAFE_componentWillMount() {
    const subscription = this.manager.onStateChange((state) => {
      this.setState({ actionResult: state });
      if (state === 'PoweredOn') {
        this.setState({ actionResult: 'Bluetooth ON' })
        this.searchBluetoothDevices()
      }
    }, true);
  }


  stringToByte = (str) => {
    var bytes = new Array();
    var len, c;
    len = str.length;
    for (var i = 0; i < len; i++) {
      c = str.charCodeAt(i);
      if (c >= 0x010000 && c <= 0x10FFFF) {
        bytes.push(((c >> 18) & 0x07) | 0xF0);
        bytes.push(((c >> 12) & 0x3F) | 0x80);
        bytes.push(((c >> 6) & 0x3F) | 0x80);
        bytes.push((c & 0x3F) | 0x80);
      } else if (c >= 0x000800 && c <= 0x00FFFF) {
        bytes.push(((c >> 12) & 0x0F) | 0xE0);
        bytes.push(((c >> 6) & 0x3F) | 0x80);
        bytes.push((c & 0x3F) | 0x80);
      } else if (c >= 0x000080 && c <= 0x0007FF) {
        bytes.push(((c >> 6) & 0x1F) | 0xC0);
        bytes.push((c & 0x3F) | 0x80);
      } else {
        bytes.push(c & 0xFF);
      }
    }
    return bytes;
  }


  byteToString = (arr) => {
    if (typeof arr === 'string') {
      return arr;
    }
    var str = '',
      _arr = arr;
    for (var i = 0; i < _arr.length; i++) {
      var one = _arr[i].toString(2),
        v = one.match(/^1+?(?=0)/);
      if (v && one.length == 8) {
        var bytesLength = v[0].length;
        var store = _arr[i].toString(2).slice(7 - bytesLength);
        for (var st = 1; st < bytesLength; st++) {
          store += _arr[st + i].toString(2).slice(2);
        }
        str += String.fromCharCode(parseInt(store, 2));
        i += bytesLength - 1;
      } else {
        str += String.fromCharCode(_arr[i]);
      }
    }
    return str;
  }

  searchBluetoothDevices = () => {

    this.state.deviceList = []
    console.log('Started searching devices');
    var i = 0;

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        this.setState({ actionResult: error.message });
        return
      }
      console.log('device', device.name ? device : '')
      // console.log(`Found Device ${device.id}. ${i} is connected = ${device.isConnectable ? null : 'Not connected'}
      //   \n Device name = ${device.localName ? null : 'No name for this Device'}`);
      this.state.deviceList.unshift(device);
      // if (this.state.deviceList.length === 10) {
      //   this.manager.stopDeviceScan();
      // }
      if (device.id === 'A523C71A-870A-59C7-5584-A81B8468020A') { //|| device.name === 'DSD TECH'
        this.manager.stopDeviceScan();
        // Proceed with connection.
        device.connect()
          .then((device) => {
            return device.discoverAllServicesAndCharacteristics();
          })
          .then(async (device) => {
            console.log('Services and characteristics discovered');
            const services = await device.services()
            console.log('dv', device);
            console.log('services', services);
            const ss = await device.characteristicsForService(services[0].uuid)
            console.log('ss', ss)
            const cha = await services[3].characteristics()
            console.log('cha', cha)

            const re = await device.readCharacteristicForService(cha[0].serviceUUID, cha[0].uuid)
            console.log('ádasd1', re.value)
            console.log('zzxzwxw', Buffer.from(re.value, 'base64'))
            const value = this.byteToString(Buffer.from(re.value, 'base64'));
            console.log('read success', value);
          })
          .catch((error) => {
            // Handle errors
            // alert(error.message);
          });
      }
      i++;
    });

  }

  render() {

    return (
      <View style={styles.MainStyle}>

        <View style={styles.Headercontainer}>
          <Text style={styles.headerTextStyle}>Bluetooth App</Text>
          <Text> A sample for react-native-ble-plx library!</Text>
        </View>

        <View style={styles.middle}>
          <Button
            onPress={this.searchBluetoothDevices}
            title={'Search Devices'}
          />

          <Button
            onPress={() => console.log('teste')}
            title={'teste'}
          />
          {/* <DeviceList deviceList={this.state.deviceList} /> */}
        </View>

        <View style={styles.footerStlye}>
          <Text>Action Results: {this.state.actionResult}</Text>
        </View>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  MainStyle: {
    flexDirection: 'column',
    flex: 4
  },
  Headercontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerTextStyle: {
    fontSize: 20,
  },
  middle: {
    flex: 2,
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  footerStlye: {
    flex: 1,
    backgroundColor: '#fff',
  },
});