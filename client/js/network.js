//vectors format: Map[string(topic_id): List[float]]
function get2DVectors(vectors, successCallback){
    var request = $.ajax({
        url: "/get2DVectors",
        method: "POST",
        data: vectors
      });
       
      request.done(function( response ) {
        successCallback(response);
      });
       
      request.fail(function( jqXHR, textStatus ) {
        alert( "Request failed: " + textStatus );
      });
}

function getTokenizedDocs(docs, successCallback, failureCallback){
    var request = $.ajax({
        url: "/getDocsFromTexts",
        method: "POST",
        data: JSON.stringify({docs: docs}),
        contentType: "application/json; charset=utf-8",
        dataType   : "json"
      });

      request.done(function( response ) {
        successCallback(response.docs);
      });

      request.fail(function( jqXHR, textStatus ) {
        if(failureCallback)
            failureCallback(textStatus);
          else{
              alert( "Request failed: " + textStatus );
          }
      });
}

// docs format: List[List[string(word)]]
function getWord2VecClusters(docs, successCallback, failureCallback){
    var request = $.ajax({
        url: "/api/getClustersWord2Vec",
        method: "POST",
        data: JSON.stringify({docs: docs, start: window.vueApp.settings.start2, end: window.vueApp.settings.end2, selected: window.vueApp.settings.selectedDataset}),
        contentType: "application/json; charset=utf-8",
        dataType   : "json"
      });
       
      request.done(function( response ) {
        successCallback(JSON.parse(response));
      });
       
      request.fail(function( jqXHR, textStatus ) {
          if(failureCallback)
            failureCallback(textStatus);
          else{
              alert( "Request failed: " + textStatus );
          }

      });
}

function getLDAClusters(docs, successCallback, failureCallback){
    var request = $.ajax({
        url: "/api/getLDAData",
        method: "POST",
        data: JSON.stringify({docs: docs, start: window.vueApp.settings.start1, end: window.vueApp.settings.end1, selected: window.vueApp.settings.selectedDataset}),
        contentType: "application/json; charset=utf-8",
        dataType   : "json"
      });
       
      request.done(function( response ) {
        successCallback(response);
      });
       
      request.fail(function( jqXHR, textStatus ) {
        if(failureCallback)
            failureCallback(textStatus);
          else{
              alert( "Request failed: " + textStatus );
          }
      });
}
