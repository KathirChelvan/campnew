import { View, Text, FlatList, Image, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import {db} from './../../config/FirebaseConfig'
import Colors from './../../constants/Colors'
import { TouchableOpacity } from 'react-native';

export default function Category({category}) {

    const [CategoryList,setCategoryList]=useState([]);
    const [selectedCategory,setSelectedategory]=useState('Clubs');
    useEffect(()=>{
        GetCategories();
    },[])
    const GetCategories=async()=>{
      setCategoryList([]);
      const snapshot=await getDocs(collection(db,'Category'));
      snapshot.forEach((doc)=>{
        setCategoryList(CategoryList=>[...CategoryList,doc.data()])
      })

    }
  return (
  <View style={{
  marginTop: 20
  }}>
    <Text style={{
    fontFamily: 'outfit-med',
    fontSize:20
    }}>Category</Text>

      <FlatList
        data={CategoryList}
        numColumns={4}
        renderItem={({item,index})=>(
          <TouchableOpacity
            onPress={()=>{setSelectedategory(item.name);
              category(item.name)
            }}
          style={{
            flex:1,
            alignItems: 'center', // Center the item (image + text) horizontally
        justifyContent: 'center', // Center the item (image + text) vertically
        margin: 9,
          }}>
            <View style={[styles.conatiner,
              selectedCategory==item.name&&styles.selectedCategoryContainer]}>
              <Image source={{uri:item?.imageUrl}}
                style={{
                  width:45,
                  height:35
                }}
              />
            </View>
            <Text style={{
              textAlign:'center',
              fontFamily:'outfit-med',
              width:80,
              marginTop:5,
              marginHorizontal:15,
            }}>{item?.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
  }

  const styles = StyleSheet.create({
    conatiner:{
      backgroundColor:Colors.LIGHTGREY,
      padding:10,
      alignItems:'center',
      justifyContent:'center',
      borderWidth:2,
      borderRadius:15,
      borderColor:Colors.Muted_Navy_Blue,
      margin:5,
    },
    selectedCategoryContainer:{
      backgroundColor:Colors.highyellow,
      borderColor:Colors.BLACK
    }
})