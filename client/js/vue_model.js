window.vueApp = new Vue({
    el: '#vue-app',
    data: {
        message: 'Hello user!',
        noneSelected: true,
        selectedPage: 5,
        playerDetail: {
            name: "<Player Name>"
        },
        overviewFilters: {},
        newDocs: [],
        selectedMap: 1,
        success: false,
        loading: false,
        failure: false,
        newDoc: '',
        newDocsProccessed: '',
        showProcessed: false,
        settings: {
            selectedMethod: "LDA",
            selectedDataset: 0,
            start1: 11,      //HappyDB
            end1: 21,        //HappyDB
            start2: 0,      //Medium
            end2: 1,        //Medium
            ldaTopicThreshold: 0,
            word2VecThreshold: 0
        },
        params: {
            topicThreshold: 0.02,
            wordThreshold: 0.02,
            wordOverallThreshold: 0,
        }
    },
    methods: {
        selectPage: function(x){
            this.selectedPage = x;
            if (x == 1){
                initPage1(window.global_data);
            }
            if (x == 2){
                initPage2(window.global_data);
            }
            if (x == 3){
                initPage3(window.global_data);
            }
            if (x == 4){
                initPage4(window.global_data);
            }
        },
        addNewDoc: function(){
            if (this.newDoc.trim().split(" ").length < 3){
                alert("Please add at least 3 words");
                return;
            }
            this.newDocs.push(this.newDoc);
            this.newDoc = '';
            this.showProcessed = false;
        },
        processDocs: function () {
            var self = this;
            getTokenizedDocs(this.newDocs, function(resp){
                self.newDocsProccessed = resp;
                self.showProcessed = true;
            });
        },
        saveChanges: function(){
            var self = this;
            self.success = false;
            self.failure = false;
            if (this.settings.selectedDataset == 0){
                if(this.settings.end1 - this.settings.start1 < 10){
                    alert("There needs to be atleast 5 documents(& <= 50) for Happy DB. And start index can not be greater than end.");
                    return;
                } else if(this.settings.end1 - this.settings.start1 > 50){
                    alert("There needs to be less than 50 documents for HappyDB.");
                    return;
                }
            } else if (this.settings.selectedDataset == 1){
                if(this.settings.end2 - this.settings.start2 < 1){

                    alert("There needs to be atleast 1 document for Medium Articles. And start index can not be greater than end.");
                    return;
                } else if(this.settings.end2 - this.settings.start2 > 2){
                    alert("There needs to be less than 2 documents for Medium Articles.");
                    return;
                }
            } else if (this.settings.selectedDataset == 2){
                    if (!this.showProcessed){
                        alert("Please process all documents first");
                        return;
                    }
                    window.documents = this.newDocsProccessed;
            }
            self.loading = true;

            getAnalysis(this.settings.selectedMethod, function(resp){
                self.success = true;
                self.loading = false;
            }, function (errorStatus) {
                self.loading = false;
                self.failure = true;
            });
        }
    },
    mounted: function(){
        console.log("Mounted");
        loadD3();
        loadJquery();
    }
});