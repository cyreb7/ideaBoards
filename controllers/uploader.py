import json
import urllib
from gluon.utils import web2py_uuid

# Gets an upload URL from BackBlaze
# See this like to upload files https://www.backblaze.com/b2/docs/b2_upload_file.html
def get_upload_url():
    # From https://www.backblaze.com/b2/docs/b2_get_upload_url.html
    request = urllib2.Request(
        '%s/b2api/v1/b2_get_upload_url' % UPLOAD_URL,
        json.dumps({ 'bucketId' : myconf.get('backblaze.bucket_id') }),
        headers = { 'Authorization': myconf.get('backblaze.authorization_token') }
    )
    response = urllib2.urlopen(request)
    response_data = json.loads(response.read())
    response.close()
    
    return response.json(dict(uploadUrl = response_data['uploadUrl'],
                              authorizationToken = response_data['authorizationToken'],
                              file_name = "images/" + web2py_uuid()))
