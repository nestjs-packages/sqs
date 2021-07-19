aws configure set aws_access_key_id "$AWS_SQS_ACCESS_KEY_ID" &&
aws configure set aws_secret_access_key "$AWS_SQS_SECRET_ACCESS_KEY" &&
aws configure set region "$AWS_SQS_REGION"

aws --endpoint-url http://localhost:4566 sqs create-queue --queue-name c
aws --endpoint-url http://localhost:4566 sqs create-queue --queue-name test-dead
aws --endpoint-url http://localhost:4566 sqs create-queue --queue-name test --attributes '{
  "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:ap-northeast-2:000000000000:test-dead\",\"maxReceiveCount\":\"1\"}",
  "MessageRetentionPeriod": "259200"
}'