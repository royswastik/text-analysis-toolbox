function generateTopicVectors(){
    window.topicVectors = {};
    if(window.topic_word_probability_in_topic){
        for(var x in window.topic_word_probability_in_topic){
            var vector = [];
            for(var y in window.topic_word_probability_in_topic[x]){
                vector.push(window.topic_word_probability_in_topic[x][y]);
            }
            window.topicVectors[x] = vector;
        }
    }
}

function generateParallelCoordinateData(response, topic_threshold, word_threshold){
    let visData = [];
    for (var docKey in response["document_topic"]){
        for(var topic in response["document_topic"][docKey]){
            let topicScore = response["document_topic"][docKey][topic];
            if (topicScore > topic_threshold){

                for(var word in response["topic_word"][topic]){
                    let wordScore = response["topic_word"][topic][word];
                    if (wordScore > word_threshold){
                        visData.push({
                            "name": docKey,
                            "document":  docKey,
                            "topic": topic,
                            "word": response["overall_word"][word]
                        });
                    }
                }

            }
        }
    }
    return visData;
}

function generateParallelCoordinateDataHC(response, topic_threshold, word_threshold){
    let visData = [];
    for (var docKey in response["document_topic"]){
        for(var topic in response["document_topic"][docKey]){
            let topicScore = response["document_topic"][docKey][topic];
            if (topicScore > topic_threshold){

                for(var word in response["topic_word"][topic]){
                    let wordScore = response["topic_word"][topic][word];
                    if (wordScore > word_threshold){
                        visData.push([parseInt(docKey), parseInt(topic), response["words"].indexOf(word)]);
                    }
                }

            }
        }
    }
    return visData;
}


