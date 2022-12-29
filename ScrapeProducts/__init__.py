import datetime
import logging
from twisted.internet import reactor
import scrapy
from scrapy.crawler import CrawlerRunner
from ScrapeProducts.productscrawler.spiders.ProductsSpider import ProductsSpider
from azure.storage.blob import ContainerClient
from azure.storage.blob import BlobServiceClient
import os

import azure.functions as func


def main(mytimer: func.TimerRequest) -> None:
    logging.info('Started')
    productsFile = "/home/products.json"
    productsFileBlob = "products.json"
    if os.path.exists(productsFile):
        os.remove(productsFile)
        logging.info('Deleted products file')
    utc_timestamp = datetime.datetime.utcnow().replace(
        tzinfo=datetime.timezone.utc).isoformat()

    if mytimer.past_due:
        logging.info('The timer is past due!')

    process =  CrawlerRunner(settings = {
        "FEEDS": {
            productsFile: {"format": "json"},
        },
    })
    logging.info('Start crawling')

    d = process.crawl(ProductsSpider)
    d.addBoth(lambda _: reactor.stop())
    reactor.run() # the script will block here until the crawling is finished
    #process.crawl(ProductsSpider)
    #process.run() # the script will block here until the crawling is finished
    logging.info('Finished crawling')
    
    connection_string = os.environ["CONNECTION_STRING"]

    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = ContainerClient.from_connection_string(connection_string, container_name="samples-workitems")

    #print(container_client)
    # Create a blob client using the local file name as the name for the blob
    blob_client = blob_service_client.get_blob_client(container="samples-workitems", blob=productsFileBlob)
    #print(blob_client)
    # Upload the created file
    with open(file=productsFile, mode="rb") as data:
        blob_client.upload_blob(data, overwrite=True)

    logging.info('Python timer trigger function ran at %s', utc_timestamp)
