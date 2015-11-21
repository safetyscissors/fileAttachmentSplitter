takes file attachment dir and splits it up.

run with
    node server.js pathToInputFiles numberOfOutputFolders copyOnlyFlag
eg
    node server.js ~/Desktop/file_attachments/ 10 true
     
pathToInputFolders is the folder to the top level of the file attachments. the output folder will be put inside here too.
numberOfInputFolders is the number of output folders
copyOnlyFlag uses the cp command instead of mv command.


1. it reads the top level of pathToInputFiles
2. creates a directory, fileAttachmentOutput
3. recursively moves the top level files into fileAttachemntOutput/output#
4. creates a tar directory and runs tar -zcvf archive_name.tar.gz folder_to_compress on each fileAttachmentOutput/output# folder
