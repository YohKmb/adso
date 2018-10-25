Adso (beta)
====

Web resource tracker/visualizer utilizing Chrome Headless Browser


![Demo](https://github.com/YohKmb/adso/blob/master/.demo/after.png)

### Description

With this tool, you can identify numerous web resources when you land on a web page.

I wrote this codes for the purpose related cyber-security analysis. (ex. Compromised sites, phishing sites, ad-frauding. etc.)

This might be beneficial for data compriance checking such like GDRP.

I named this after a main character who appeared in "The Name of The Rose" written by Umberto Eco. Adso is an apprentice monk in medieval age. He challenges a hidden labyrinth in monastery and struggles and solve many traps and enigmas in the dungeon.


### Usage

    1) Launch Chrome browser in the headless-mode with CLI. (ex. Chrome --remote-debugging-port=9222)
    2) Execute the "mainapp.js" file with node interpreter. 
    3) Open another web-browser and access http://localhost:1337.
    4) Supply a URL which you want to examine.
    5) Push the play-button beside the URL field.
    6) Click any resource icons and check details and the reason why it was accessed.
      
### Notes

 - Windows Firewall

    This tool tries to connect Chroome Headless process using TCP/9222. So you have to allow TCP/9222 access to localhost in the Windows Firewall configuration.


### Requirement

 - Chrome >= 59
 - NodeJs >= 8.x


### Licence

MIT (https://github.com/YohKmb/watchman/blob/master/LICENSE)

### Author

Yoh Kamibayashi (https://github.com/YohKmb)
