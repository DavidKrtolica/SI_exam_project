import scrapy
from twisted.internet import reactor
from scrapy.crawler import CrawlerRunner
from ProductsSpider import ProductsSpider
from azure.storage.blob import ContainerClient
from azure.storage.blob import BlobServiceClient

process = CrawlerRunner(settings = {
    "FEEDS": {
        "products.json": {"format": "json"},
    },
})

d = process.crawl(ProductsSpider)
d.addBoth(lambda _: reactor.stop())
reactor.run() # the script will block here until the crawling is finished
"""
connection_string = 'DefaultEndpointsProtocol=https;AccountName=yggrasil;AccountKey=IgF2r6e2XexC9NHfXrZ7tY1jCAmpfLipDMgD5Il7EmSM0WPRADgPCAvJGtxkPv7ZCu88LuQODPRH+AStFRptMQ==;EndpointSuffix=core.windows.net'

blob_service_client = BlobServiceClient.from_connection_string(connection_string)
container_client = ContainerClient.from_connection_string(connection_string, container_name="products")

# Create a local directory to hold blob data
productsFile = "products.json"

#print(container_client)
# Create a blob client using the local file name as the name for the blob
blob_client = blob_service_client.get_blob_client(container="products", blob=productsFile)
#print(blob_client)
# Upload the created file
with open(file=productsFile, mode="rb") as data:
    blob_client.upload_blob(data)

"""