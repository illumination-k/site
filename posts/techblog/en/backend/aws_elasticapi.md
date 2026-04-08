---
uuid: 428cbaba-1dc2-4887-88dd-ce9ccee4c0b6
title: The Story of How I Lost Money by Not Releasing an Elastic IP Address on AWS
description: A cautionary tale about getting billed by AWS after leaving resources running when you're done playing around
lang: en
category: techblog
tags:
  - backend
  - aws
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## What Happened

(This article is from 2019.10.20.)

Cloud computing has been all the rage lately, so I decided to give AWS a try. I got an Elastic IP, launched an EC2 instance, ran a simple Python web app on it, and was satisfied.

When I was done playing around, I stopped the EC2 instance and left it as is. I don't check my credit card statements very often, so I left it alone for about 3-4 months. When I happened to glance at my credit card statement, I noticed that AWS had been charging me every month.
The bottom line is that this accident happened because I hadn't released the Elastic IP. Be careful with AWS, everyone -- mysterious charges can appear if you're not paying attention.

## When I Saw the Bill

Something was wrong -- I was sure I had disabled the EC2 instance. I rushed to check the bill. There, in the Elastic Compute Cloud section, I found this line:

```
$0.005 per Elastic IP address not attached to a running instance per hour (prorated)
```

## Checking AWS's Pricing Structure

AWS's pricing structure is known for being incredibly complex, so I searched for the relevant section on the pricing page ([EC2 Pricing Page](https://aws.amazon.com/jp/ec2/pricing/on-demand/)).

> Elastic IP Addresses
> One Elastic IP (EIP) address associated with a running instance is free of charge. If you associate additional EIPs with that instance, you are charged for each additional EIP on a per-hour (prorated) basis. Additional EIPs are available only in Amazon VPC.
> To ensure efficient use of Elastic IP addresses, we charge a small hourly fee when these IP addresses are not associated with running instances or when they are associated with stopped instances or unattached network interfaces. Elastic IP addresses created from IP address prefixes brought to AWS using Bring Your Own IP are free of charge.

**The key part is this: you get charged when an Elastic IP is associated with a stopped instance.** It turns out this is the type where you actually get charged more when the instance is stopped.

> To ensure efficient use of Elastic IP addresses, we charge a small hourly fee when these IP addresses are not associated with running instances or when they are associated with stopped instances or unattached network interfaces.

## Releasing the Elastic IP Address

I released it using the following steps:

1. Select EC2 in the AWS Console
2. Navigate to the Region where the EC2 instance was running
3. Select Elastic IP
4. Select "Release IP address" from the Actions dropdown

Since I just released it now, I'll still be charged a bit for this month, but hopefully the mysterious charges will stop from next month onwards.

## Lesson of the Day

If you're going to use AWS, make sure you read the pricing structure thoroughly. Skipping the reading just because there's too much to read will cost you money.
