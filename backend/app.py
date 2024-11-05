from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import matplotlib.pyplot as plt
import os
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_preprocess

app = Flask(__name__)
CORS(app)
model = tf.keras.models.load_model('models/resnet50_binary_classifier.h5')

def preprocess_image(image):
    if image.mode != 'RGB':
        image = image.convert('RGB')
    image = image.resize((224, 224))
    image_array = np.array(image)
    image_array = resnet_preprocess(image_array)
    return np.expand_dims(image_array, axis=0)

def preprocess_txt(file_content):
    try:

        data = np.loadtxt(io.BytesIO(file_content), delimiter=',')
        return data
    except Exception as e:
        raise ValueError(f"Error processing .txt file: {str(e)}")

def create_chart(data):
    plt.figure()
    plt.axis('off')
    plt.plot(data)
 
    chart_path = 'static/chart.png'
    plt.savefig(chart_path, bbox_inches='tight', pad_inches=0)
    plt.close()
    
    return chart_path


@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        try:
            image = Image.open(io.BytesIO(file.read()))
            data = preprocess_image(image)
            prediction = model.predict(data)
            predicted_class = int(prediction[0][0] > 0.5)
            accuracy = float(prediction[0][0]) if predicted_class == 1 else float(1 - prediction[0][0])
            return jsonify({'prediction': predicted_class, 'accuracy': accuracy}), 200
        except Exception as e:
            return jsonify({'error': f'Error processing file: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Invalid file type. Please upload an image file (.png, .jpg, .jpeg).'}), 400

@app.route('/predict-txt', methods=['POST'])
def predict_txt():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and file.filename.lower().endswith('.txt'):
        try:
            file_content = file.read()
            data = preprocess_txt(file_content)
            chart_path = create_chart(data)
            chart_image = Image.open(chart_path)    
            preprocessed_chart_data = preprocess_image(chart_image)
            prediction = model.predict(preprocessed_chart_data)
            predicted_class = int(prediction[0][0] > 0.5)
            accuracy = float(prediction[0][0]) if predicted_class == 1 else float(1 - prediction[0][0])

            return jsonify({
                'prediction': predicted_class,
                'accuracy': accuracy,
                'chartUrl': f'http://localhost:5000/static/chart.png' 
            }), 200
        except ValueError as e:
            return jsonify({'error': str(e)}), 500
        except Exception as e:
            return jsonify({'error': f'Error processing file: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Invalid file type. Please upload a .txt file.'}), 400

@app.route('/model-details', methods=['GET'])
def model_details():
    training_graph_acc_url = '/info/hist_train_accur.png'
    training_graph_loss_url = '/info/hist_train_lost.png'  
    matrix_graph_url ='/info/matrix.png'
    arc_graph_url ='/info/arc.png'
    return jsonify({
        'trainingGraphACCURUrl': f'http://localhost:5000/{training_graph_acc_url}',
        'trainingGraphLOSTUrl': f'http://localhost:5000/{training_graph_loss_url}',
        'matrixGraphUrl':f'http://localhost:5000/{matrix_graph_url}',
        'arctGraphUrl':f'http://localhost:5000/{arc_graph_url}'
    })

@app.route('/info/<path:filename>', methods=['GET'])
def serve_info(filename):
    return send_file(os.path.join('info', filename))

if __name__ == '__main__':
    os.makedirs('static', exist_ok=True)
    os.makedirs('info', exist_ok=True)  
    app.run(debug=True)
