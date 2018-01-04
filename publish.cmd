del dist\lambda.zip
7z a -tzip dist\lambda.zip -r *.*
aws lambda update-function-code --function-name vertretungsplan --zip-file fileb://dist/lambda.zip