import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import BleModule from './BleModule';
//Ensure that there is only one BleManager instance globally, and the BleModule class holds the Bluetooth connection information
global.BluetoothManager = new BleModule();

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scaning: false,
      isConnected: false,
      text: '',
      writeData: '',
      receiveData: '',
      readData: '',
      data: [],
      isMonitoring: false
    }
    this.bluetoothReceiveData = [];  // Data buffer received by Bluetooth
    this.deviceMap = new Map();
  }

  componentDidMount() {
    // Monitor Bluetooth switch
    this.onStateChangeListener = BluetoothManager.manager.onStateChange((state) => {
      console.log("onStateChange: ", state);
      if (state == 'PoweredOn') {
        this.scan();
      }
    })
  }

  componentWillUnmount() {
    BluetoothManager.destroy();
    this.onStateChangeListener && this.onStateChangeListener.remove();
    this.disconnectListener && this.disconnectListener.remove();
    this.monitorListener && this.monitorListener.remove();
  }

  alert(text) {
    Alert.alert('prompt', text, [{ text: 'determine', onPress: () => { } }]);
  }

  scan() {
    if (!this.state.scaning) {
      this.setState({ scaning: true });
      this.deviceMap.clear();
      BluetoothManager.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.log('startDeviceScan error:', error)
          if (error.errorCode == 102) {
            this.alert('Please turn on the phones Bluetooth before searching');
          }
          this.setState({ scaning: false });
        } else {
          console.log(device.id, device.name);
          this.deviceMap.set(device.id, device); //Use the Map type to save the searched Bluetooth devices to ensure that the list does not show duplicate devices
          this.setState({ data: [...this.deviceMap.values()] });
        }
      })
      this.scanTimer && clearTimeout(this.scanTimer);
      this.scanTimer = setTimeout(() => {
        if (this.state.scaning) {
          BluetoothManager.stopScan();
          this.setState({ scaning: false });
        }
      }, 1000)  //Stop searching after 1 second
    } else {
      BluetoothManager.stopScan();
      this.setState({ scaning: false });
    }
  }

  connect(item) {
    if (this.state.scaning) {  //Scanning when connected, stop scanning first
      BluetoothManager.stopScan();
      this.setState({ scaning: false });
    }
    if (BluetoothManager.isConnecting) {
      console.log('Cannot open another connection process while the current Bluetooth is connecting');
      return;
    }
    let newData = [...this.deviceMap.values()];
    newData[item.index].isConnecting = true;  //Connecting
    this.setState({ data: newData });
    BluetoothManager.connect(item.item.id)
      .then(device => {
        newData[item.index].isConnecting = false;
        this.setState({ data: [newData[item.index]], isConnected: true });
        this.onDisconnect();
      })
      .catch(err => {
        newData[item.index].isConnecting = false;
        this.setState({ data: [...newData] });
        this.alert(err);
      })
  }

  read = (index) => {
    BluetoothManager.read(index)
      .then(value => {
        this.setState({ readData: value });
      })
      .catch(err => {

      })
  }

  write = (index, type) => {
    if (this.state.text.length == 0) {
      this.alert('Please enter a message');
      return;
    }
    BluetoothManager.write(this.state.text, index, type)
      .then(characteristic => {
        this.bluetoothReceiveData = [];
        this.setState({
          writeData: this.state.text,
          text: '',
        })
      })
      .catch(err => {

      })
  }

  writeWithoutResponse = (index, type) => {
    if (this.state.text.length == 0) {
      this.alert('Please enter a message');
      return;
    }
    BluetoothManager.writeWithoutResponse(this.state.text, index, type)
      .then(characteristic => {
        this.bluetoothReceiveData = [];
        this.setState({
          writeData: this.state.text,
          text: '',
        })
      })
      .catch(err => {

      })
  }

  //Monitor Bluetooth data 
  monitor = (index) => {
    let transactionId = 'monitor';
    this.monitorListener = BluetoothManager.manager.monitorCharacteristicForDevice(BluetoothManager.peripheralId,
      BluetoothManager.nofityServiceUUID[index], BluetoothManager.nofityCharacteristicUUID[index],
      (error, characteristic) => {
        if (error) {
          this.setState({ isMonitoring: false });
          console.log('monitor fail:', error);
          this.alert('monitor fail: ' + error.reason);
        } else {
          this.setState({ isMonitoring: true });
          this.bluetoothReceiveData.push(characteristic.value); //If the amount of data is large, it will be received multiple times
          this.setState({ receiveData: this.bluetoothReceiveData.join('') })
          console.log('monitor success', characteristic.value);
          // this.alert('Successfully opened'); 
        }

      }, transactionId)
  }

  //Monitor Bluetooth disconnection
  onDisconnect() {
    this.disconnectListener = BluetoothManager.manager.onDeviceDisconnected(BluetoothManager.peripheralId, (error, device) => {
      if (error) {  //Bluetooth automatically disconnects when encountering an error
        console.log('onDeviceDisconnected', 'device disconnect', error);
        this.setState({ data: [...this.deviceMap.values()], isConnected: false });
      } else {
        this.disconnectListener && this.disconnectListener.remove();
        console.log('onDeviceDisconnected', 'device disconnect', device.id, device.name);
      }
    })
  }

  //Disconnect Bluetooth
  disconnect() {
    BluetoothManager.disconnect()
      .then(res => {
        this.setState({ data: [...this.deviceMap.values()], isConnected: false });
      })
      .catch(err => {
        this.setState({ data: [...this.deviceMap.values()], isConnected: false });
      })
  }

  renderItem = (item) => {
    let data = item.item;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={this.state.isConnected ? true : false}
        onPress={() => { this.connect(item) }}
        style={styles.item}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ color: 'black' }}>{data.name ? data.name : ''}</Text>
          <Text style={{ color: "red", marginLeft: 50 }}>{data.isConnecting ? 'connecting...' : ''}</Text>
        </View>
        <Text>{data.id}</Text>

      </TouchableOpacity>
    );
  }

  renderHeader = () => {
    return (
      <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.buttonView, { marginHorizontal: 10, height: 40, alignItems: 'center' }]}
          onPress={this.state.isConnected ? this.disconnect.bind(this) : this.scan.bind(this)}>
          <Text style={styles.buttonText}>{this.state.scaning ? 'Searching' : this.state.isConnected ? 'Disconnect Bluetooth' : 'Search Bluetooth'}</Text>
        </TouchableOpacity>

        <Text style={{ marginLeft: 10, marginTop: 10 }}>
          {this.state.isConnected ? 'Currently connected device' : 'Available equipment'}
        </Text>
      </View>
    )
  }

  renderFooter = () => {
    return (
      <View style={{ marginBottom: 30 }}>
        {this.state.isConnected ?
          <View>
            {this.renderWriteView('Write data(write)：', 'send',
              BluetoothManager.writeWithResponseCharacteristicUUID, this.write)}
            {this.renderWriteView('Write data(writeWithoutResponse)：', 'send',
              BluetoothManager.writeWithoutResponseCharacteristicUUID, this.writeWithoutResponse)}
            {this.renderReceiveView('Data read:', 'Read',
              BluetoothManager.readCharacteristicUUID, this.read, this.state.readData)}
            {this.renderReceiveView(`Monitor the received data: ${this.state.isMonitoring ? 'Monitoring is on' : 'Monitoring is not turned on'}`, 'Open monitoring',
              BluetoothManager.nofityCharacteristicUUID, this.monitor, this.state.receiveData)}
          </View>
          : <View style={{ marginBottom: 20 }}></View>
        }
      </View>
    )
  }

  renderWriteView = (label, buttonText, characteristics, onPress, state) => {
    if (characteristics.length == 0) {
      return null;
    }
    return (
      <View style={{ marginHorizontal: 10, marginTop: 30 }} behavior='padding'>
        <Text style={{ color: 'black' }}>{label}</Text>
        <Text style={styles.content}>
          {this.state.writeData}
        </Text>
        {characteristics.map((item, index) => {
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              style={styles.buttonView}
              onPress={() => { onPress(index) }}>
              <Text style={styles.buttonText}>{buttonText} ({item})</Text>
            </TouchableOpacity>
          )
        })}
        <TextInput
          style={[styles.textInput]}
          value={this.state.text}
          placeholder='Please enter a message'
          onChangeText={(text) => {
            this.setState({ text: text });
          }}
        />
      </View>
    )
  }

  renderReceiveView = (label, buttonText, characteristics, onPress, state) => {
    if (characteristics.length == 0) {
      return null;
    }
    return (
      <View style={{ marginHorizontal: 10, marginTop: 30 }}>
        <Text style={{ color: 'black', marginTop: 5 }}>{label}</Text>
        <Text style={styles.content}>
          {state}
        </Text>
        {characteristics.map((item, index) => {
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.buttonView}
              onPress={() => { onPress(index) }}
              key={index}>
              <Text style={styles.buttonText}>{buttonText} ({item})</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <FlatList
          renderItem={this.renderItem}
          keyExtractor={item => item.id}
          data={this.state.data}
          ListHeaderComponent={this.renderHeader}
          ListFooterComponent={this.renderFooter}
          extraData={[this.state.isConnected, this.state.text, this.state.receiveData, this.state.readData, this.state.writeData, this.state.isMonitoring, this.state.scaning]}
          keyboardShouldPersistTaps='handled'
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: Platform.OS == 'ios' ? 20 : 0,
  },
  item: {
    flexDirection: 'column',
    borderColor: 'rgb(235,235,235)',
    borderStyle: 'solid',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingLeft: 10,
    paddingVertical: 8,
  },
  buttonView: {
    height: 30,
    backgroundColor: 'rgb(33, 150, 243)',
    paddingHorizontal: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: 'center',
    alignItems: 'flex-start',
    marginTop: 10
  },
  buttonText: {
    color: "white",
    fontSize: 12,
  },
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
  textInput: {
    paddingLeft: 5,
    paddingRight: 5,
    backgroundColor: 'white',
    height: 50,
    fontSize: 16,
    flex: 1,
  },
})

