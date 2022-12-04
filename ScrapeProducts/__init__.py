import datetime
import logging
import scrapy
from scrapy.crawler import  CrawlerRunner
from ScrapeProducts.productscrawler.spiders.ProductsSpider import ProductsSpider
from azure.storage.blob import ContainerClient
from azure.storage.blob import BlobServiceClient

import azure.functions as func


def main(mytimer: func.TimerRequest) -> None:
    logging.info('Started')
    utc_timestamp = datetime.datetime.utcnow().replace(
        tzinfo=datetime.timezone.utc).isoformat()

    if mytimer.past_due:
        logging.info('The timer is past due!')

    process =  CrawlerRunner(settings = {
        "FEEDS": {
            "/home/products.json": {"format": "json"},
        },
    })
    logging.info('Start crawling')
    process.crawl(ProductsSpider)
    process.run() # the script will block here until the crawling is finished
    logging.info('Finished crawling')
    
    connection_string = 'DefaultEndpointsProtocol=https;AccountName=yggrasil;AccountKey=IgF2r6e2XexC9NHfXrZ7tY1jCAmpfLipDMgD5Il7EmSM0WPRADgPCAvJGtxkPv7ZCu88LuQODPRH+AStFRptMQ==;EndpointSuffix=core.windows.net'

    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = ContainerClient.from_connection_string(connection_string, container_name="products")

    # Create a local directory to hold blob data
    productsFile = "/home/products.json"

    #print(container_client)
    # Create a blob client using the local file name as the name for the blob
    blob_client = blob_service_client.get_blob_client(container="products", blob=productsFile)
    #print(blob_client)
    # Upload the created file
    with open(file="/home/products.json", mode="rb") as data:
        blob_client.upload_blob(data)

    logging.info('Python timer trigger function ran at %s', utc_timestamp)
