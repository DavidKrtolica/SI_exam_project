"""import scrapy
from twisted.internet import reactor
from scrapy.crawler import CrawlerRunner
from ProductsSpider import ProductsSpider
from azure.storage.blob import BlobServiceClient

process = CrawlerRunner(settings = {
    "FEEDS": {
        "products.json": {"format": "json"},
    },
})
d = process.crawl(ProductsSpider)
d.addBoth(lambda _: reactor.stop())
reactor.run() # the script will block here until the crawling is finished
#process.crawl(ProductsSpider)
#process.start() # the script will block here until the crawling is finished"""
"""
blob_service_client = BlobServiceClient.from_connection_string("DefaultEndpointsProtocol=https;AccountName=testingscrapeddata;AccountKey=CVgLErjeeYlRqDwfBuOCrjpne5mW/QTT5ciFTRhozzwOGPBU5GE9yBTcznUdKVTQKoZouXnFilzs+AStDmVsQw==;EndpointSuffix=core.windows.net")

# Create a local directory to hold blob data
productsFile = "./products.json"

# Create a blob client using the local file name as the name for the blob
blob_client = blob_service_client.get_blob_client(container="testupload", blob=productsFile)

# Upload the created file
with open(file=productsFile, mode="rb") as data:
    blob_client.upload_blob(data)
"""