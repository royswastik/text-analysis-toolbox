import csv
import torch
from models import InferSent
import numpy as np
MODEL_PATH =  './encoder/infersent1.pkl'
params_model = {'bsize': 64, 'word_emb_dim': 300, 'enc_lstm_dim': 2048,
                'pool_type': 'max', 'dpout_model': 0.0, 'version': 1}
model = InferSent(params_model)
model.load_state_dict(torch.load(MODEL_PATH))
W2V_PATH = './dataset/GloVe/glove.840B.300d.txt'
model.set_w2v_path(W2V_PATH)


def cosine(u, v):
    return np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))


tp = 0
fp = 0
tn = 0
fn = 0

with open('test_data.csv') as csv_file:
    csv_reader = csv.reader(csv_file, delimiter=',')
    line_count = 0
    for row in csv_reader:
        if line_count == 0:
            continue

        line_count += 1
        s1 = row[0]
        s2 = row[1]
        s3 = row[2]
        e1 = model.encode([s1])[0]
        e2 = model.encode([s2])[0]
        e3 = model.encode([s3])[0]
        m1 = cosine(e1, e2)
        m2 = cosine(e1, e3)
        m3 = cosine(e2, e3)
        expected = row[3]
        actual = "TRUE" if m2 > m3 else "FALSE"
        print(line_count, " -> ", actual)
        if expected == "TRUE":
            if actual == "TRUE":
                tp += 1
            else:
                fn += 1
        else:
            if actual == "TRUE":
                fp += 1
            else:
                tn += 1

precision = tp / (fp+tp)
recall = tp / (tp+fn)
f1Score = 2 * (precision*recall)/(precision+recall)
print("Precision: ", precision)
print("Recall: ", recall)
print("F1 Score: ", f1Score)