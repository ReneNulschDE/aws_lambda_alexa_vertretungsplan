Alexa Integration - Substitute teacher plan - Leibniz Gymnasium Leipzig (Indiware?)
===============

Simple AWS lambda function for Alexa Integration

Deployment:
7z a -tzip lambda.zip -r *.*
aws lambda update-function-code --function-name vertretungsplan --zip-file fileb://c:/private/aws_lambda_alexa_vertretungsplan/lambda.zip
