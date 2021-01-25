import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { LogLevel } from 'react-native-ble-plx/src/TypeDefinition';
// import BleManager from 'react-native-ble-manager';
// import DeviceList from './components/DeviceList';

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
      if (this.state.deviceList.length === 10) {
        this.manager.stopDeviceScan();
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