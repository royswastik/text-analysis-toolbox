function loadWordCloud(resp){
    let data = [];
    for(var word in resp["overall_word"]){
        let weight = resp["overall_word"][word];
         data.push({
            name: word,
            weight: weight
        });
    }
    createWordCloud("overall-wc", data, "All Documents");

    for(var topic in resp["topic_word"]){
        let data = [];
        for(var word in resp["topic_word"][topic]){
            let weight = resp["topic_word"][topic][word];
            data.push({
                name: word,
                weight: weight
            });
        }
        $("#topic-wcs").append('<div class="col-sm-6"><div style="outline: solid 1px;" id="topic'+topic+'" style="height: 300px;"></div></div>');
        createWordCloud("topic"+topic, data, "Topic "+topic);
    }
}

function createWordCloud(id, data, title){
    Highcharts.chart(id, {
        series: [{
            type: 'wordcloud',
            data: data,
            rotation: {
                from: 0,
                to: 0,
                orientations: 5
            },
            name: 'Score'
        }],
        title: {
            text: title
        }
    });
}