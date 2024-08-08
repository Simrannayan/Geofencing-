import React, { useEffect, useState } from 'react';
import { View, Text, Button, Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polygon } from 'react-native-maps';

const App = () => {
  const [location, setLocation] = useState(null);
  const [geofenceCenter, setGeofenceCenter] = useState(null);
  const [geofences, setGeofences] = useState({}); // Store geofences in a hashmap
  const [role, setRole] = useState('user'); // State to store role

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
      console.log('Current Position:', position); // Debug line
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
      { latitude: 28.480852032348064, longitude: 77.10190393427344 }, // top-left 
      { latitude: 28.480778263517664, longitude: 77.10235369043151  }, // top-right    
      { latitude: 28.48060802755854, longitude: 77.10237090597822}, // bottom-right
      { latitude: 28.4806855795295, longitude: 77.10187165512335 }  // bottom-left
    ]
  };

  const checkGeofences = (coords) => {
    Object.values(predefinedGeofences).forEach((geofence, index) => {
      const isInside = isPointInPolygon(coords, geofence);
      console.log('Geofence Check:', isInside, geofence); // Debug line
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
      { latitude: location.coords.latitude - 0.001, longitude: location.coords.longitude - 0.001 }  // bottom-left
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

      {/* Role Buttons */}
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
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
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
