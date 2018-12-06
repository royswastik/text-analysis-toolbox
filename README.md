# text-analysis-toolbox
Text Analysis using sentence embedding and LDA.


You can see the video demo of the working application at - https://youtu.be/JGLAzkVEtBY

Or, if you want setup application on your own system, follow the below rules,

### System Requirements
1. Memory(RAM) >= 16GB 
2. 2 CPU Cores.
3. Graphics Memory > 4GB   (2GB might work, but will be slow)

###To start the server for  main application(shown in demo)
1. Ensure you have Python 3.6 or higher.
2. Run "pip install -r requirements.txt" in client directory    (Ensure you are not using pip for python 2.7)
3. Go to python 3 shell and run below commands,
    - import nltk
    - nltk.download("punkt")
    - nltk.download("stopwords")
    - nltk.download("wordnet")
    - nltk.download()
4. Download all files from https://drive.google.com/drive/folders/1-3jHaFjQ03dVxY18KHHybmFQfNdQ2py6?usp=sharing
5. Put all downloaded files from step 4 in client directory of the project.
6. Under client directory, run "FLASK_APP=server.py flask run"

### To test the implementation
1. Ensure that 'test.csv' is in client directory. (with Python 3.6)
2. Ensure all dependencies are installed.
3. Do all steps except step 6 for instruction on starting the server.
4. Run "python test.py"
5. The output will show Precision, Recall and F1 Score.

#####Note
You might face problem while installing torch using pip, because the installation depends on the version of your
operating system. Go to https://pytorch.org/ to install appropriate version.