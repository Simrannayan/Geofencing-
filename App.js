import React, { useEffect, useState } from 'react';
import { View, Text, Button, Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polygon } from 'react-native-maps';

const App = () => {
  const [location, setLocation] = useState(null);
  const [geofenceCenter, setGeofenceCenter] = useState(null);
  const [geofences, setGeofences] = useState({});
  const [role, setRole] = useState('user');

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestLocationPermission();
    } else {
      getCurrentLocation();
    }
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const providerStatus = await Location.getProviderStatusAsync();
      if (!providerStatus.locationServicesEnabled) {
        Alert.alert('Error', 'Location services are disabled. Please enable them.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(position);
      setGeofenceCenter({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      checkGeofences(position.coords);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not get location');
    }
  };

  const predefinedGeofences = {
    geofence1: [
      { latitude: 28.480220935800702, longitude: 77.10208252020924 }, // top-right                  //emaar 2(indigo)
      { latitude: 28.480226608537322, longitude: 77.10193408374754 }, // top-left
      { latitude: 28.479869225534735, longitude: 77.10183727735945 }, // bottom-left
      { latitude: 28.47985788002279, longitude: 77.10194053750674 },  // bottom-right
      { latitude: 28.480220935800702, longitude: 77.10208252020924 }, // close the loop to top-right
    ],
    geofence2:[
      {latitude:28.48173831717597, longitude:77.10746827788579}, //top right                //emaar 1
      {latitude:28.48171120501472, longitude:77.10715848275196},  //top left
      {latitude:28.481572697125902,longitude:77.1071578121997},  //bottom left       
      {latitude:28.481580948664778, longitude:77.10748705334844}  //bottom right
    ],
    geofence3:[
      {latitude:28.481291286776568, longitude:77.10194976533356}, //top right                 //gbp
      {latitude:28.481265942692694, longitude:77.10219652855706},//top left, 
      {latitude:28.48122350607351, longitude:77.10193970705001}, //bottom left
      {latitude:28.48120523474612, longitude:77.10215562487055}  //bottom right
    ]
  };

  const checkGeofences = (coords) => {
    Object.values(predefinedGeofences).forEach((geofence, index) => {
      const isInside = isPointInPolygon(coords, geofence);
      if (isInside) {
        if (role === 'admin') {
          Alert.alert(
            'Geofence',
            'You are inside a predefined geofence region. Are you present?',
            [
              {
                text: 'Yes',
                onPress: () => console.log('Admin confirmed presence'),
              },
              {
                text: 'No',
                onPress: () => console.log('Admin denied presence'),
                style: 'cancel',
              },
            ],
            { cancelable: false }
          );
        } else {
          Alert.alert(
            'Geofence',
            'You are inside a predefined geofence region.',
            [
              {
                text: 'OK',
                onPress: () => console.log('User acknowledged'),
              },
            ],
            { cancelable: false }
          );
        }
      } else {
        Alert.alert('Geofence', 'You are outside the geofence region.');
      }
    });
  };

  const isPointInPolygon = (point, polygon) => {
    const x = point.latitude, y = point.longitude;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].latitude, yi = polygon[i].longitude;
      const xj = polygon[j].latitude, yj = polygon[j].longitude;

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handleAddGeofence = () => {
    if (role !== 'admin') {
      Alert.alert('Access Denied', 'Only admins can add new geofences.');
      return;
    }
    if (!location) {
      Alert.alert('Geofence', 'Current location is not set yet.');
      return;
    }
    const geofenceId = `geofence${Object.keys(geofences).length + 1}`;
    const newGeofence = [
      { latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude - 0.001 }, // top-left
      { latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude + 0.001 }, // top-right
      { latitude: location.coords.latitude - 0.001, longitude: location.coords.longitude + 0.001 }, // bottom-right
      { latitude: location.coords.latitude - 0.001, longitude: location.coords.longitude - 0.001 }, // bottom-left
      { latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude - 0.001 }, // close the loop to top-left
    ];
    setGeofences({ ...geofences, [geofenceId]: newGeofence });
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ textAlign: 'center', margin: 10 }}>Geofencing Example</Text>
      {location && (
        <Text style={{ textAlign: 'center' }}>
          Location: {location.coords.latitude}, {location.coords.longitude}
        </Text>
      )}
      <Button title="Get Current Location" onPress={getCurrentLocation} />
      <Button title="Add Geofence" onPress={handleAddGeofence} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', margin: 10 }}>
        <Button title="User" onPress={() => setRole('user')} />
        <Button title="Admin" onPress={() => setRole('admin')} />
      </View>
      <Text style={{ textAlign: 'center', margin: 10 }}>Current Role: {role}</Text>

      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: geofenceCenter ? geofenceCenter.latitude : 0,
          longitude: geofenceCenter ? geofenceCenter.longitude : 0,
          latitudeDelta: 0.0022,
          longitudeDelta: 0.0021,
        }}
        showsUserLocation={true}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }}
            title="You are here"
            description="This is your current location"
          />
        )}
        {Object.values(predefinedGeofences).map((geofence, index) => (
          <Polygon
            key={`predefined-${index}`}
            coordinates={geofence}
            strokeColor="rgba(0,0,255,0.5)"
            fillColor="rgba(0,0,255,0.2)"
          />
        ))}
        {Object.values(geofences).map((geofence, index) => (
          <Polygon
            key={`dynamic-${index}`}
            coordinates={geofence}
            strokeColor="rgba(255,0,0,0.5)"
            fillColor="rgba(255,0,0,0.2)"
          />
        ))}
      </MapView>
    </View>
  );
};

export default App;
