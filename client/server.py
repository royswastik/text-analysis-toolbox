from flask import Flask, request, send_from_directory
from flask import jsonify
import json
import pandas as pd

from gensim.models import Word2Vec
import numpy as np
from sklearn.cluster import KMeans
from sklearn import metrics
from nltk.tokenize import RegexpTokenizer
from stop_words import get_stop_words
from nltk.stem.porter import PorterStemmer
from gensim import corpora, models
import gensim
from sklearn.decomposition import PCA
from collections import Counter
from nltk.stem.wordnet import WordNetLemmatizer
import operator
app = Flask(__name__)
en_stop = get_stop_words('en')
tokenizer = RegexpTokenizer(r'\w+')
lmtzr = WordNetLemmatizer()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def themecss(path):
    return send_from_directory('.', path)


@app.route("/get2DVectors", methods=['POST'])
def get2DVectors():
    post = request.get_json()
    print(post)
    vectors_tuple = []
    for topic_id, vector in post.items():
        vectors_tuple.append((topic_id, vector))
    tuple_2d = get_pca(vectors_tuple)
    res = []
    for t in tuple_2d:
        res[t[0]] = t[1]
    return jsonify(res)


@app.route("/api/getClustersWord2Vec", methods=['POST'])
def getWord2Vec_TopicClusters():
    post = request.get_json()
    print(post)
    start_page = int(post["start"])
    end_page = int(post["end"])
    db_selected = int(post["selected"])
    if db_selected == 0:
        df = pd.read_csv("cleaned_hm.csv")
        dfRange = df.iloc[start_page:end_page]
        cleaned_text = dfRange["cleaned_hm"].tolist()
        docs = []
        for l in cleaned_text:
            docs.append(l.split())
    elif db_selected==1:
        df = pd.read_csv("articles.csv")
        dfRange = df.iloc[start_page:end_page]
        text = dfRange["text"].tolist()
        docs = []
        for l in text:
            docs.append(l.split())
    else:
        docs = post["docs"]
    print(docs)
    res = getWord2VecClusters(docs)
    return jsonify(res)

@app.route("/api/getLDAData", methods=['POST'])
def getLDA_TopicClusters():
    post = request.get_json()
    print(post)
    start_page = int(post["start"])
    end_page = int(post["end"])
    db_selected = int(post["selected"])
    if db_selected == 0:
        df = pd.read_csv("cleaned_hm.csv")
        dfRange = df.iloc[start_page:end_page]
        cleaned_text = dfRange["cleaned_hm"].tolist()
        docs = []
        for l in cleaned_text:
            docs.append(l.split())
    elif db_selected==1:
        df = pd.read_csv("articles.csv")
        dfRange = df.iloc[start_page:end_page]
        text = dfRange["text"].tolist()
        docs = []
        for l in text:
            docs.append(l.split())
    else:
        docs = post["docs"]
    
    # tokenizer = RegexpTokenizer(r'\w+')

    # p_stemmer = PorterStemmer()
    texts = []

    for i in docs:

        tokens = i
        stopped_tokens = [i for i in tokens if not i.lower() in en_stop]
        texts.append(stopped_tokens)

    dictionary = corpora.Dictionary(texts)
    
    corpus = [dictionary.doc2bow(text) for text in texts]
    ldamodel = gensim.models.ldamodel.LdaModel(corpus, num_topics=10, id2word = dictionary)

    words = [item for sublist in texts for item in sublist]

    counts = Counter(words)

    counts = dict(counts)

    max_freq = max(counts.items(), key=operator.itemgetter(1))[1]
    min_freq = min(counts.items(), key=operator.itemgetter(1))[1]

    frequency_distribution = {k: ((v - min_freq + 0.000000001)/ (max_freq - min_freq + + 0.000000001)) for k, v in counts.items()}

    t7 = []

    i = 0
    for d in docs :
        bow = dictionary.doc2bow(d)
        topics = ldamodel.get_document_topics(bow) 
        data1 = {i : dict(ldamodel.get_document_topics(bow))}
        t7.append(data1)
        i = i + 1
   
    dict1 = {}
    for i in range(0, len(t7)):
        dict1[i] = t7[i][i]
    
    i = 0

    t9 = []
    topics_list = []
    for i in range(0,10) :
        tupple_dict_topic_word_prob_in_topic = {i: dict(ldamodel.show_topic(i))}
        topics_list.append(str(i))
        t9.append(tupple_dict_topic_word_prob_in_topic)
        i = i + 1

    dict2= {}
    for i in range(0, len(t9)):
        dict2[i] = t9[i][i]
    
    topics = ldamodel.get_topics()
    pca = PCA(n_components=2)
    pca_new = pca.fit_transform(topics)

    topic_vectors = pca_new.tolist()

    dict3= {}
    for i in range(0, len(topic_vectors)):
        dict3[i] = topic_vectors[i]
    
    word_distribution_list = []
    for word in words :
        word_distribution = { word : frequency_distribution.get(word)}
        word_distribution_list.append(word_distribution)

    dict4= {}
    for i in range(0, len(word_distribution_list)):
        new_dict = word_distribution_list[i]
        for k, v in new_dict.items():
            dict4[k] = v

    words = list(set(words))
    data = {"document_topic" : dict1, "topic_word" : dict2, "topics" : topics_list, "topic_vectors" : dict3, "overall_word" : dict4, "words" : words}

    try:
        data1 = json.dumps(data, default = myconverter)
    except Exception as e:
        print ("Exception", e)
    return data1

def get_pca(data):
    sent = [v[0] for v in data]
    data_vect = [v[1] for v in data]
    pca = PCA(n_components=2)
    reduced_dims_vect = pca.fit_transform(data_vect)
    reduced_dims_data = [(sent[i], reduced_dims_vect[i]) for i in range(len(sent))]
    return reduced_dims_data


def find_centroid(vectors):
    return np.mean(vectors, axis=0)


def cosine(u, v):
    return np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))


def getWord2VecClusters(docs):
    model = Word2Vec(docs, size=100, window=5, min_count=1, workers=4)

    def make_clusters(embeddings, texts):
        kmeans_model = 0
        old_silhoutte = -1
        best_k = 0
        best_silhoutte = -100
        labels = []
        print(len(texts) // 2)
        for k in range(2, min(10, len(texts)-1)):
            kmeans_model_tmp = KMeans(n_clusters=k, random_state=1).fit(embeddings)
            silhoutte = metrics.silhouette_score(embeddings, kmeans_model_tmp.labels_, metric='cosine')
            print("Silhoutte for k=" + str(k) + " is " + str(silhoutte))
            if silhoutte > best_silhoutte:
                kmeans_model = kmeans_model_tmp
                print("best k updated = " + str(best_k) + " -> " + str(k))
                print("best silhoutte updated = " + str(old_silhoutte) + " -> " + str(silhoutte))
                best_k = k
                best_silhoutte = silhoutte
                labels = kmeans_model_tmp.labels_
                centroids = kmeans_model_tmp.cluster_centers_
                old_silhoutte = silhoutte

        print("best k = " + str(best_k))
        print(labels)  # [1 0 1 0 2 1 0 1] Sample Output for labels\
        return labels, centroids

    def make_word2vec_clusters(documents):
        documents = removeStopWords(documents)
        word_set = set()
        for document in documents:
            word_set |= set(document)
        word_list = list(word_set)
        model = Word2Vec([word_list], size=100, window=5, min_count=1, workers=4)
        embeddings = []
        for index, word in enumerate(word_list):
            emb = model.wv[word]
            embeddings.append(emb)
        res = {
            "word_embeddings": [],
            "topic_embeddings": {},
            "document_embeddings": [],
            "document_word": {},
            "topic_word": {},
            "document_topic": {},
            "overall_centroid": []
        }

        labels, centroids = make_clusters(embeddings, word_list)
        res["overall_centroid"] = find_centroid(centroids)
        res["topic_embeddings"] = centroids
        document_embeddings = [find_centroid([model.wv[word] for word in d]) for d in documents]
        res["document_embeddings"] = document_embeddings
        for index, word in enumerate(word_list):
            emb = model.wv[word]
            embeddings.append(emb)
            res["word_embeddings"].append([word, labels[index], emb])
            res["document_word"][word] = cosine(emb, res["overall_centroid"])
            topic = labels[index]

            if str(topic) not in res["topic_word"]:
                res["topic_word"][str(topic)] = {}
            res["topic_word"][str(topic)][word] = cosine(res["topic_embeddings"][topic], emb)

        for index, topic in enumerate(res["topic_word"].keys()):
            topic = int(topic)
            emb = res["topic_embeddings"][topic]
            for doc_index, doc_emb in enumerate(res["document_embeddings"]):
                if str(doc_index) not in res["document_topic"]:
                    res["document_topic"][str(doc_index)] = {}
                res["document_topic"][str(doc_index)][str(topic)] = cosine(res["topic_embeddings"][topic], doc_emb)
        return res
    res = make_word2vec_clusters(docs)
    words_set = set()
    for key1, val1 in res["topic_word"].items():
        for key, val in val1.items():
            words_set.add(key)

    vectors_tuple = []
    # Get 2D coordinates for topics using PCA
    for topic_id, vector in enumerate(res["topic_embeddings"]):
        vectors_tuple.append((topic_id, vector))
    tuple_2d = get_pca(vectors_tuple)
    topic_vectors = {}
    for t in tuple_2d:
        topic_vectors[str(t[0])] = [t[1][0], t[1][1]]

    res = {
        "topic_word": res["topic_word"],
        "document_topic": res["document_topic"],
        "overall_word": res["document_word"],
        "words": list(words_set),
        "topic_vectors": topic_vectors
    }
    res = stringify_keys(res)
    res["topics"] = list(res["topic_word"].keys())
    # res = jsonify({"res": res})

    res = json.dumps(res)
    # return json.dumps(res)
    # return make_response(res)
    return res

def stringify_keys(d):
    """Convert a dict's keys to strings if they are not."""
    for key in d.keys():

        # check inner dict
        if isinstance(d[key], dict):
            value = stringify_keys(d[key])
        else:
            value = d[key]

        # convert nonstring to string if needed
        if not isinstance(key, str):
            try:
                d[str(key)] = value
            except Exception:
                try:
                    d[repr(key)] = value
                except Exception:
                    raise

            # delete old key
            del d[key]
    return d

# Each documents contains sentence
@app.route("/getDocsFromTexts", methods=['POST'])
def getDocumentsFromTexts():
    post = request.get_json()
    docs = post['docs']
    newDocs = []
    for doc in docs:
        tokens = tokenizer.tokenize(doc)
        newDocs.append(tokens)

    newDocs = removeStopWords(newDocs)
    return json.dumps({'docs': newDocs})

def removeStopWords(documents):
    newDocuments = []
    for doc in documents:
        newDoc = [lmtzr.lemmatize(i) for i in doc if not i.lower() in en_stop]
        newDocuments.append(newDoc)
    return newDocuments

def myconverter(o):
    if isinstance(o, np.float32):
        return float(o)

def key_to_json(data):
    if data is None or isinstance(data, (bool, int, str)):
        return data
    if isinstance(data, (tuple, frozenset)):
        return str(data)
    raise TypeError

def to_json(data):
    if data is None or isinstance(data, (bool, int, tuple, range, str, list)):
        return data
    if isinstance(data, (set, frozenset)):
        return sorted(data)
    if isinstance(data, dict):
        return {key_to_json(key): to_json(data[key]) for key in data}
    raise TypeError

if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    app.debug = True
    app.run(port=5000)
