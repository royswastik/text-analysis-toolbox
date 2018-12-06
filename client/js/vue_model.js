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
        saveChanges: function(){
            var self = this;
            self.success = false;
            self.failure = false;
            self.loading = true;
            if(self.newDocs.length == 0){
                alert("No documents.");
                return;
            }

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