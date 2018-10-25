Adso (beta)
====

Web resource tracker/visualizer utilizing Chrome Headless Browsser

|Before|After|
|---|---|
![](https://github.com/YohKmb/adso/blob/master/.demo/before.png)|![](https://github.com/YohKmb/adso/blob/master/.demo/after.png)

### Description

With this tool, you can identify numerous web resources when you land on a web page.

I wrote this codes for the purpose related cyber-security analysis. (ex. Compromised sites, phishing sites, ad-frauding. etc.)

This might be beneficial for data compriance checking such like GDRP.

I named this after a main character who appeared in "The Name of The Rose" written by Umberto Eco. Adso is an apprentice monk in medieval age. He challenges a hidden labyrinth in monastery and struggles and solve many traps and enigmas in the dungeon.

 - watchman : 

    As demonstrated in the animation above, you can dynamically monitor results and statistics of them of ICMP health-checking to multiple devices.
    Targets of ICMP can be editored from web-base gui. (You can directly modify json file, if you want.)
    
    As you guess, this tool was named after a certain great graphic novel.
    
    [Usage]
    
        1) Execute "watchman" script with an administrator privilege.
        2) Open your favarite web-browser. (Please not so obsolete version...)
        3) Access to http://localhost:5000/main or http://localhost:5000/ .
        4) Play like the demo animation above.
      
 - lib/pinger.py : 

    Pure-Python ICMP CLI utility tool. At this moment, this can work only on *nix platmfoms. (related to socket allocatin problem)


### Notes

 - Administrator Privilege

    You have to execute scripts in this repository with an administor privilege.
    It's required to open sockets.

 - Future Support for Windows Platforms

    At this moment, this package is in beta-version. I'll support windows platforms and ping-springboards via ssh connections.
    It's also planned to support IPv6.


### Requirement

 - Flask >= 0.10.1


### Licence

MIT (https://github.com/YohKmb/watchman/blob/master/LICENSE)

### Author

Yoh Kamibayashi (https://github.com/YohKmb)
