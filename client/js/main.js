require.config({
    paths: {
        "d3": "https://d3js.org/d3.v3.min"
    }
});

function loadD3(){

    window.d3Old = d3;
    require(['d3'], function(d3V3) {
        window.d3V3 = d3V3;
        window.d3 = d3Old;
        // window.documents = [
        //         //   ["i", "am", "batman", "of", "winterfall"],
        //         //   ["there", "should", "always", "be", "a", "stark", "in", "winterfell"],
        //         //   ["prophecy", "says", "prince", "will", "be" , "reborn"]
        //         // ];
        //     window.documents = [['project', 'classification', 'compare', 'neural', 'nets', 'SVM', 'due', 'due'], ['two', 'new', 'progress', 'checks', 'final', 'project',  'assigned', 'follows'], ['report', 'graded',  'contribute', 'points',  'total', 'semester', 'grade'], ['progress', 'update', 'evaluated', 'TA', 'peers'], ['class', 'meeting', 'tomorrow','teams', 'work', 'progress', 'report', 'final', 'project'], [ 'quiz',  'sections', 'regularization', 'Tuesday'], [ 'quiz', 'Thursday', 'logistics', 'work', 'online', 'student', 'postpone',  'quiz', 'Tuesday'], ['quiz', 'cover', 'Thursday'], ['quiz', 'chap', 'chap', 'linear', 'regression']];

        window.documents = [
            ['serious',
                      'talk',
                      'friends',
                      'flaky',
                      'lately',
                      'understood',
                      'good',
                      'evening',
                      'hanging'],
            ['got', 'gift', 'elder', 'brother', 'really', 'surprising'],
                     ['completed',
                      '5',
                      'miles',
                      'run',
                      'without',
                      'break',
                      'makes',
                      'feel',
                      'strong'],

            ['son', 'performed', 'well', 'test',
                'preparation']
            ];

                // getAnalysis("LDA");
        });
}

function getDocs(texts) {
  return window.documents = texts.map(x => x.split());
}

function getAnalysis(method, success, fail) {
  let docs = vueApp.newDocs;
  let fnc = x => x;
  if (method === "LDA") {
    fnc = getLDAClusters;
  } else {
    fnc = getWord2VecClusters;
  }
  window.loadDFunc =  fnc;
  fnc(docs, resp => {
      window.global_data = resp;
    initPage1(resp);
    initPage2(resp);
    initPage3(resp);
    initPage4();
    if(success){
        success(resp);
    }
  }, fail);
}

function loadVisualizations() {
}

function initPage1(resp) {
  renderClusterAnalysis(resp);
}



function initPage2(resp) {
    $("#speciescollapsible").html("");
  renderClusterForceLayout(resp);

}

function initPage3(resp){
    $("#parallel-coordinate-vis").html("");
    $("#pc-container").html("");
    loadParallelCoordinate(resp);
    loadParallelCoordinatesHC(resp);
}

function initPage4(){
    $("#overall-wc").html("");
    loadWordCloud(window.global_data);
}