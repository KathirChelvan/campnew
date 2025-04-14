import { View, Text, Image, StyleSheet } from 'react-native'
import React from 'react'
import Colors from '../../constants/Colors'
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function Ownerinfo({SRM}) {
  return (
    <View style={styles?.container}>
      <View style={{
        display:'flex',
        flexDirection:'row',
        gap:20
      }}>
      <Image source={{uri:SRM?.adminImage}}
      style={{
        width:50,
        height:50,
        borderRadius:15
      }}/>
      <View>
        <Text style={{
          fontFamily:'outfit-med',
          fontSize:16
        }}>{SRM?.adminName}</Text>
        <Text style={{
          fontFamily:'outfit-reg',
          color:Colors.GRAY
        }}>Club Admin</Text>
      </View>
      </View>
      <FontAwesome name="send-o" size={24} color="black" />
      
    </View>
  )
}

const styles = StyleSheet.create({
  container:{
    marginHorizontal:20,
    paddingHorizontal:20,
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    gap:20,
    borderWidth:1,
    borderRadius:15,
    borderRadius:10,
    borderWidth:2,
    padding:9,
    backgroundColor:Colors.WHITE,
    justifyContent:'space-between'
  }
})