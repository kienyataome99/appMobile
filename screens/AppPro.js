import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Moment from 'moment';
import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import {
  Dimensions,

  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import * as Animatable from 'react-native-animatable';
// import Animated from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import End from '../components/End';
import Process from '../components/Process';
import QuestionSlide from '../components/QuestionSlide';
import Start from '../components/Start';
import { AuthContext } from '../navigations/AuthProvider';
const AppPro = ({route}) => {
  const navigation = useNavigation();
  // const [percent, setPercent] = useState(100);
  const {userData,updateStateExamTrue} = useContext(AuthContext);
  const {language, topic, logo} = route.params;
  const [visible, setVisible] = useState(true);
  const [visibleEnd, setVisibleEnd] = useState(false);
  const [end, setEnd] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [multiAnswers, setMultiAnswers] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  // const fadeAnim = new Animated.Value(100);
  const [isStart, setIsStart] = useState(false);
  useEffect(() => {
    firestore()
      .collection('questions')
      .where('language', '==', language)
      .where('topic', '==', topic)
      .onSnapshot((data) => {
        setQuestions(
          data.docs.map((doc) => ({
            ...doc.data(),
          })),
        );
      });
  }, []);

  const handleStart = () => {
    updateStateExamTrue(userData.uid)
    setIsStart(true);
    setVisible(false);
    questions.map((question, index) => {
      if (question.multiOption) {
        multiAnswers.push({
          index: index + 1,
          question: question.question,
          correct_One: question.answerOne,
          correct_Two: question.answerTwo,
        });
      } else {
        answers.push({
          index: index + 1,
          multiOption: question.multiOption,
          answer: question.answerOne,
        });
      }
    });
  };
  const scroll = useRef(null);

  const checkAnswer = () => {
    answers.map((answer) => {
      const countAnswer = userAnswers.filter((e) => e.index === answer.index);
      if (countAnswer.length === 1) {
        if (countAnswer[0].answer === answer.answer)
          setScore((currscore) => currscore + 1);
      }
    });
  };
  const checkMultiAnswer = () => {
    multiAnswers.map((multiAnswer) => {
      const countAnswer = userAnswers.filter(
        (e) => e.index === multiAnswer.index,
      );
      console.log(countAnswer);
      if (countAnswer.length === 2) {
        let count = 0;
        countAnswer.map((ca) => {
          if (
            ca.answer === multiAnswer.correct_One ||
            ca.answer === multiAnswer.correct_Two
          ) {
            count = count + 1;
          }
        });
        if (count === 2) {
          setScore((currscore) => currscore + 1);
        }
      }
    });
  };
  const handleNext = (index) => {
    scroll.current.scrollTo({x: width * index, animated: true});
  };
  const countScore = async () => {
    await checkMultiAnswer();
    await checkAnswer();
  };
  const handleSubmit = async () => {
    await countScore();
    setIsStart(false);
    setTimeout(() => {
      setVisibleEnd(true);

    }, 0);
    
  };
  const handleView = (score) => {
    setVisibleEnd(false);
    setEnd(true);
    setIsStart(false);
    setTimeout(() => {
      // addHistory(score)
      // const timestamp = firestore.FieldValue.serverTimestamp()
      firestore()
        .collection('histories')
        .add({
          userId: userData.uid,
          // createdAt: timestamp,
          date: Moment(new Date()).format('DD/MM/YYYY HH:mm:ss'),
          logoLanguage: logo,
          topic: topic,
          score: score,
        });
    }, 0);
  };

  const onSelected = (index, answer) => {
    const answerIndex = userAnswers?.findIndex((e) => e.answer === answer);

    if (answerIndex !== -1) {
      userAnswers.splice(answerIndex, 1);
    } else {
      const userAnswer = {
        index: index,
        question: questions[index - 1].question,
        answer: answer,
      };
      setUserAnswers([...userAnswers, userAnswer]);
    }
    if (questions[index - 1].multiOption === false) {
      scroll.current.scrollTo({x: width * index, animated: true});
    }
    const dataIndex = userAnswers?.filter((e) => e.index === index);
    if (dataIndex.length >= 1) {
      scroll.current.scrollTo({x: width * index, animated: true});
    }
  };
  const setEndProcess = async () => {
    await countScore();
    setTimeout(() => {
      setVisibleEnd(true);
      setIsStart(false);
    }, 0);
  };
  const handleBack = () =>{
    updateStateExamFalse(userData.uid)
    navigation.goBack()
  }
  return (
    <View flex={1}>
      <StatusBar barStyle="light-content" />
      <Animatable.View animation="bounceIn">
        <Start
          logo={logo}
          language={language}
          handleStart={handleStart}
          visible={visible}
        />
      </Animatable.View>
      <Animatable.View animation="bounceIn">
        <End
          logo={logo}
          handleView={handleView}
          visible={visibleEnd}
          score={score}
        />
      </Animatable.View>
      <View style={styles.container}>
        <View
          height={height * 0.1}
          backgroundColor={'white'}
          style={styles.header}>
          <View
            style={{
              marginLeft: 20,
              marginRight: 30,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
            flex={1}>
            <Feather
              name="arrow-left"
              size={35}
              color={'green'}
              style={{position: 'absolute', left: 0}}
              onPress={() =>  handleBack()}
            />
            <Text style={styles.title}>{language}</Text>
            <Text style={styles.titleTopic}>Đề {topic}</Text>
          </View>
          <View style={{marginLeft: 40, marginRight: 40}}>
            {isStart ? (
              <Process isStart={isStart} setEndProcess={setEndProcess} />
            ) : null}
          </View>
        </View>
        <View height={height * 0.9}>
          <ScrollView
            ref={scroll}
            scrollEnabled={true}
            // pagingEnabled={true}
            showsHorizontalScrollIndicator={false}
            horizontal
            snapToInterval={width}
            decelerationRate="fast"
            scrollEventThrottle={16}
            bounces={false}>
            {questions.map((question, index) => (
              <Fragment key={index}>
                <QuestionSlide
                  question={question}
                  index={index + 1}
                  handleNext={handleNext}
                  handleSubmit={handleSubmit}
                  onSelected={onSelected}
                  end={end}
                />
              </Fragment>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};
const {width, height} = Dimensions.get('window');
var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'blue',
    justifyContent: 'flex-start',
    flexDirection: 'column',
  },
  header: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'green',
  },
  titleTopic: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'green',
    marginLeft: 10,
  },

  progessbar: {
    height: 8,
    width: '100%',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 3,
    borderRadius: 40,
    borderColor: 'green',
    borderWidth: 1,
  },
  progess_inner: {
    backgroundColor: 'red',
    height: 8,
    borderRadius: 40,
  },
  button: {
    width: width * 0.5,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
});
export default AppPro;
