# decipher_letter_substitution
Decipher, letter substitution, using node.js, REST API.


Decipher, using letter substitution method.

Based on Quadgrams (group of 4 letters)

When client issues a POST, we will be receiving 2 files. The file to
decipher and the plain text from which we will base of plain english from.

Actuallly, this could probable work for any language, just as long as
both files (encrypted and plain) are based from that same language.

POST will return the key (26 letters) that can translate the text to
plain (english) language.  This key could be zhimn... where the 'z'
will stand for the 'a' letter, 'h' for 'b', 'i' for 'c', and so on.

The process the POST call follows is:
- With the plain file, generate all 4 letters quads per line. We remove 
all spaces and puntuation characters. These are kept in an array and we
count how many occurrences we have of each throughout all the file.
Once this is finished, we will start the process of generating the 
best key possible. We start with the key:

etoahsinrldumywfcgbpvkxjqz

this key is the frequency arrangement of each letter in the english language
according to its appearence. 'e' is most and 'z' being least.

Now, for the key iteration process, we read 150 lines from the encrypted 
text (don't need the whole file). And we decipher it with our current
key. We score each quad of translated text:

p(quad) = log10(count(quad)/totQuads)

adding each quad will give us a total score for this translation with this
key. next, we modify the key, a couple of letters at the time, and decipher it 
again with new key, calculate score again and compare with previous score.
We repeat this until we get the best score possible.
We translate file with the key and store it.
Return key to client.

Client receives key and generates a GET with key as the parameter searched
for. GET will read and send file back to client.

All for now.
