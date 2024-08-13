import React, { useEffect, useState } from 'react';
import { View, Text, Button, Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polygon } from 'react-native-maps';


const App = () => {
  const [location, setLocation] = useState(null);
  const [geofenceCenter, setGeofenceCenter] = useState(null);
  const [geofences, setGeofences] = useState({});
  const [role, setRole] = useState('user');
  const [showGeofencesOnly, setShowGeofencesOnly] = useState(false);
 


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
      { latitude: 28.595227057509987, longitude: 77.07985384090048 }, // top-left
      { latitude: 28.595227057509987, longitude: 77.07993296606332 }, // top-right
      { latitude: 28.595159938827017, longitude: 77.07993296606332 }, // bottom-right
      { latitude: 28.595159938827017, longitude: 77.07985384090048 }, // bottom-left
    ],
    geofence2: [
      { latitude: 28.59522823503036, longitude: 77.07963524087434 }, // top-left
      { latitude: 28.59522823503036, longitude: 77.07969424947036 }, // top-right
      { latitude: 28.595159938827017, longitude: 77.07969424947036 }, // bottom-right
      { latitude: 28.595159938827017, longitude: 77.07963524087434 }, // bottom-left
    ],
    geofence3: [
      { latitude: 28.595053961871933, longitude: 77.07962384148647 }, // top-left
      { latitude: 28.595053961871933, longitude: 77.07970833106714 }, // top-right
      { latitude: 28.59498684307843, longitude: 77.07970833106714 }, // bottom-right
      { latitude: 28.59498684307843, longitude: 77.07962384148647 }, // bottom-left
    ],
  };


  const checkGeofences = (coords) => {
    let insideGeofence = false;


    Object.values(predefinedGeofences).forEach((geofence) => {
      const isInside = isPointInPolygon(coords, geofence);
      if (isInside) {
        insideGeofence = true;
        Alert.alert('Geofence', 'You are inside a predefined geofence region.');
      }
    });


    if (!insideGeofence) {
      Alert.alert('Geofence', 'You are outside the geofence region.');
    }
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
      { latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude - 0.001 },
      { latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude + 0.001 },
      { latitude: location.coords.latitude - 0.001, longitude: location.coords.longitude + 0.001 },
      { latitude: location.coords.latitude - 0.001, longitude: location.coords.longitude - 0.001 },
    ];
    setGeofences({ ...geofences, [geofenceId]: newGeofence });
  };


  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setShowGeofencesOnly(newRole === 'admin');
  };


  return (
    <View style={{ flex: 1 }}>
      <Text style={{ textAlign: 'center', margin: 10 }}>Geofencing Example</Text>
      {!showGeofencesOnly && location && (
        <Text style={{ textAlign: 'center' }}>
          Location: {location.coords.latitude}, {location.coords.longitude}
        </Text>
      )}
      <Button title="Get Current Location" onPress={getCurrentLocation} />
      {!showGeofencesOnly && <Button title="Add Geofence" onPress={handleAddGeofence} />}


      <View style={{ flexDirection: 'row', justifyContent: 'center', margin: 10 }}>
        <Button title="User" onPress={() => handleRoleChange('user')} />
        <Button title="Admin" onPress={() => handleRoleChange('admin')} />
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
        showsUserLocation={!showGeofencesOnly}
      >
        {!showGeofencesOnly && location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
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
      </MapView>
    </View>
  );
};


export default App;
