import boto3
import os

# Terraform will inject this environment variable
INSTANCE_ID = os.environ['INSTANCE_ID']
REGION = os.environ['AWS_REGION']

ec2 = boto3.client('ec2', region_name=REGION)

def lambda_handler(event, context):
    action = event.get('action')
    
    if action == 'start':
        print(f"Starting instance: {INSTANCE_ID}")
        ec2.start_instances(InstanceIds=[INSTANCE_ID])
        return f"Started {INSTANCE_ID}"
        
    elif action == 'stop':
        print(f"Stopping instance: {INSTANCE_ID}")
        ec2.stop_instances(InstanceIds=[INSTANCE_ID])
        return f"Stopped {INSTANCE_ID}"
        
    else:
        return "Invalid action. Use 'start' or 'stop'."