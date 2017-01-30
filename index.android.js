import React, { Component } from 'react';

import {
  AppRegistry,
  Dimensions,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  Image,
  ScrollView,
  TouchableOpacity
} from 'react-native';

import Camera from 'react-native-camera';
import axios from 'axios';
// var Speech = require('react-native-speech');
import Modal from 'react-native-simple-modal';
import Spinner from 'react-native-loading-spinner-overlay';

// API KEYS
const cloudVisionKey = '';
const translateKey = '';

// Endpoints
const cloudVision = 'https://vision.googleapis.com/v1/images:annotate?key=' + cloudVisionKey;
const translateApi = 'https://www.googleapis.com/language/translate/v2?key=' + translateKey;

const supportedLanguages = [
  {
    key: 'en',
    displayName: 'English'
  },
  {
    key: 'fr',
    displayName: 'Francais'
  },
  {
    key: 'de',
    displayName: 'German'
  }
];

export default class thingTranslator extends Component {
  constructor(props) {
    super(props);
    this.state = {
      captureText: null,
      showLoader: false,
      sourceLanguage: 'en',
      targetLanguage: null
    };
    this.setTextContent = this.setTextContent.bind(this);
    this.toggleLoader = this.toggleLoader.bind(this);
    // this.speakText = this.speakText.bind(this);
    this.changeLanguage = this.changeLanguage.bind(this);
  }

  setTextContent(textContent, detectedLanguage) {
    this.toggleLoader();
    this.setState({
      captureText: textContent,
      sourceLanguage: detectedLanguage
    });
    // this.speakText(textContent,detectedLanguage);
  }

  // speakText(textToSpeak, language) {
  //   Speech.speak({
  //     text: textToSpeak,
  //     voice: language,
  //     rate: 0.4
  //   });
  // }

  toggleLoader() {
    this.setState({
      showLoader: !this.state.showLoader
    });
  }

  changeLanguage(destinationLanguage) {
    // Speech.stop();
    this.toggleLoader();
    const self = this;
    axios.get(translateApi, {
      params: {
        q: self.state.captureText,
        source: self.state.sourceLanguage,
        target: destinationLanguage
      }
    })
    .then(function (response) {
      const translatedText = response.data.data.translations[0].translatedText;
      self.setState({
        captureText: translatedText,
        showLoader: false,
        sourceLanguage: destinationLanguage,
        targetLanguage: null
      });
      // self.speakText(translatedText,destinationLanguage);
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  takePicture() {
    const self = this;
    this.toggleLoader();
    this.camera.capture()
      .then((image64) => {
        axios.post(cloudVision, {
          requests: [
            {
              image: {
                content: image64.data
              },
              features: [{
                type: 'TEXT_DETECTION',
                maxResults: 1
              }]
            }
          ]
        })
        .then(function (response) {
          const textAnnotations = response.data.responses[0].textAnnotations[0];
          const textContent = textAnnotations.description;
          const detectedLanguage = textAnnotations.locale;
          self.setTextContent(textContent,detectedLanguage);
        })
        .catch(function (error) {
          console.log(error, 'error');
        });
      }).catch(err => console.error(err));
  }

  render() {
    return (
      <View style={styles.container}>
        <Spinner visible={this.state.showLoader}/>
        <Camera
          ref={(cam) => {
            this.camera = cam;
          }}
          captureQuality={Camera.constants.CaptureQuality['720p']}
          captureTarget={Camera.constants.CaptureTarget.memory}
          style={styles.preview}
          aspect={Camera.constants.Aspect.fill}>
          <TouchableHighlight style={styles.capture} onPress={this.takePicture.bind(this)}>
            <Image
              style={{width: 100, height: 100}}
              source={{uri: 'https://s22.postimg.org/yyv1p3lzl/jbnbtn.png'}}
             />
          </TouchableHighlight>
        </Camera>
        <Modal
          offset={0}
          open={this.state.captureText}
          modalDidOpen={() => {}}
          modalDidClose={() => {}}
          style={{alignItems: 'center'}}>
          <View>
            <View style={styles.languagesContainer}>
              <ScrollView horizontal={true} style={styles.languagesScrollView}>
                {
                supportedLanguages.map((language, index) => {
                  const langStyle = this.state.sourceLanguage === language.key ? styles.activeLang : styles.scrollLanguage;
                  return <TouchableOpacity key={index} onPress={() => this.changeLanguage(language.key)}>
                    <Text style={langStyle}>{language.displayName}</Text>
                  </TouchableOpacity>;
                }, this)
                }
              </ScrollView>
            </View>
            {
              this.state.captureText ? <Text style={styles.descriptionText}>
                {this.state.captureText}</Text> : null
            }
            <TouchableOpacity
              style={{margin: 5}}
              onPress={() => this.setState({captureText: null})}>
              <Text>Try another</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#458dca'
  },
  descriptionText: {
    fontSize: 16,
    padding: 15,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  scrollLanguage: {
    height: 40,
    padding: 12,
    fontSize: 12,
    color: 'white'
  },
  activeLang: {
    height: 40,
    padding: 12,
    fontSize: 12,
    backgroundColor: '#529bd8',
    color: 'white'
  },
  languagesContainer: {
    flex: 0,
    height: 40
  },
  languagesScrollView: {
    backgroundColor: '#1868ab'
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width
  },
  objectShow: {
    flex: 0,
    color: 'red',
    marginBottom: 140
  }
});

AppRegistry.registerComponent('thingTranslator', () => thingTranslator);
