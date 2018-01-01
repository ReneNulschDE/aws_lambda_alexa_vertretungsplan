del lambda.zip
7z a -tzip lambda.zip -r *.*
aws lambda update-function-code --function-name vertretungsplan --zip-file fileb://c:/private/aws_lambda_alexa_vertretungsplan/lambda.zip