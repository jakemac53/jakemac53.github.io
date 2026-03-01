
import 'dart:io';

void main() async {
  final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 8080);
  print('Serving at http://${server.address.address}:${server.port}');

  await for (HttpRequest request in server) {
    var path = request.uri.path;
    if (path.endsWith('/')) path += 'index.html';
    if (path.isEmpty) path = '/index.html';
    
    // Security: Only allow files within the current directory
    // Remove leading slash for File constructor
    final filePath = path.startsWith('/') ? path.substring(1) : path;
    final file = File(filePath);
    
    if (await file.exists()) {
      try {
        request.response.headers.contentType = _contentTypeFor(path);
        await file.openRead().pipe(request.response);
      } catch (e) {
        print('Error serving $path: $e');
        request.response.statusCode = HttpStatus.internalServerError;
        await request.response.close();
      }
    } else {
      request.response.statusCode = HttpStatus.notFound;
      request.response.write('Not Found: $path');
      await request.response.close();
    }
  }
}

ContentType _contentTypeFor(String path) {
  if (path.endsWith('.html')) return ContentType.html;
  if (path.endsWith('.js')) return ContentType('application', 'javascript');
  if (path.endsWith('.css')) return ContentType('text', 'css');
  if (path.endsWith('.png')) return ContentType('image', 'png');
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return ContentType('image', 'jpeg');
  if (path.endsWith('.svg')) return ContentType('image', 'svg+xml');
  return ContentType.binary;
}
