(function ()
{
    'use strict';

    $dyn.ui.defaults.AVADragDropBasicControl = {};
    $dyn.controls.AVADragDropBasicControl = function (data, element)
    {
        var self = this;
        $dyn.ui.Control.apply(self, arguments);
        $dyn.ui.applyDefaults(self, data, $dyn.ui.defaults.AVADragDropBasicControl);

        $(element).css("border", "2px dashed #EAEAEA");
        $(element).css("position", "relative");
        $(element).css("border radius", "10px");
        $(element).css("width", "100px");
        $(element).css("margin", "50px auto");
        $(element).css("padding", "10px");
        $(element).css("border color", "blau");
        $(element).css("border type", "dashed");
        $(element).css("background color", "blau");

        function fileUpload(file)
        {
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function ()
            {
                var base64result = reader.result.split(',')[1];
                $dyn.callFunction(self.UploadFile, self, { _fileName: file.name, _content: base64result });

            };
            reader.onerror = function (error)
            {
                console.log('Error: ', error);
            };
        };



        // ************************ Drag and drop ***************** //
        let dropArea = this.element;

        // Prevent default drag behaviors
        ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName =>
        {
            dropArea.addEventListener(eventName, preventDefaults, false)
        })

        // Handle dropped files
        dropArea.addEventListener('drop', handleDrop, false)

        function preventDefaults(e)
        {
            e.preventDefault()
            e.stopPropagation()
        }

        function handleDrop(e)
        {
            var dt = e.dataTransfer
            var files = dt.files
            var items = dt.items

            if (items.length != 0)
            {
                handleItems(items)
            }
            if (files.length != 0)
            {
                handleFiles(files)
            }
            
        }

        function handleItems(items)
        {
            items = [...items]
            items.forEach(uploadItem)
        }

        function uploadItem(item, i)
        {
            var s;
            item.getAsString(function (urlString)
            {
                urlStringUpload(urlString);
            });

        }  

        function urlStringUpload(urlString)
        {
            urlUpload(urlString);
        }

        function urlUpload(urlString)
        {
            $dyn.callFunction(self.urlUpload, self, { _urlString: urlString });
        }     

       


        function handleFiles(files)
        {
            files = [...files]

            files.forEach(uploadFile)
        }

        function uploadFile(file, i)
        {
            fileUpload(file);
        }

 

    }
    $dyn.controls.AVADragDropBasicControl.prototype = $dyn.extendPrototype($dyn.ui.Control.prototype, {
        init: function (data, element)
        {
            var self = this;
            $dyn.ui.Control.prototype.init.apply(this, arguments);

        }
    });
})();
