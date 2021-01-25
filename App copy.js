//https://github.com/frost4869/rn-bluetooth-permission/blob/master/App.js
import React, { Component } from 'react';
import {
  Button,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  Linking,
  Platform,
  Alert,
} from 'react-native';

import { BleManager } from 'react-native-ble-plx';

class App extends Component {
  constructor(props) {
    super(props);

    this.manager = new BleManager();
    this.subscription = null;

    this.state = {
      bluetoothPermission: false,
    };
  }
  componentDidMount() {
    this.subscription = this.manager.onStateChange(state => {
      this.setState({
        bluetoothStatus: state,
      });
    }, true);
  }

  openSetting = () => {
    Linking.openSettings();
  };

  enableBluetooth = () => {
    if (this.state.bluetoothStatus === 'PoweredOff') {
      Alert.alert(
        '"SureReserve" would like to use Bluetooth',
        '',
        [
          {
            text: "Don't allow",
            style: 'cancel',
          },
          {
            text: 'Ok',
            onPress: () =>
              Platform.OS === 'ios'
                ? this.openSetting()
                : this.manager.enable(),
          },
        ],
        { cancelable: false },
      );
    } else {
      alert('Aleady on');
    }
  };

  render() {
    const { bluetoothStatus } = this.state;
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.container}>
          <Text>
            Bluetooth status:{' '}
            <Text style={styles.status}>{bluetoothStatus}</Text>{' '}
          </Text>
          <Button title="Enable Bluetooth" onPress={this.enableBluetooth} />
        </SafeAreaView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;