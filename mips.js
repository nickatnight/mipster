// add event lister to extension
document.getElementById("instr").addEventListener("click", function () {
    if(document.getElementById("mips").checked) mipsProcess();
    else x86Process();
});

var regSetx86 = {
    "%eax" : {
        "reg_num": "0",
        "reg_size": "32"
    }
};

var regSetMips = {
    "$0": "0",
    "$at": "1",
    "$v0": "2",
    "$v1": "3",
    "$a0": "4",
    "$a1": "5",
    "$a2": "6",
    "$a3": "7",
    "$t0": "8",
    "$t1": "9",
    "$t2": "10",
    "$t3": "11",
    "$t4": "12",
    "$t5": "13",
    "$t6": "14",
    "$t7": "15",
    "$s0": "16",
    "$s1": "17",
    "$s2": "18",
    "$s3": "19",
    "$s4": "20",
    "$s5": "21",
    "$s6": "22",
    "$s7": "23",
    "$t8": "24",
    "$t9": "25",
    "$k0": "26",
    "$k1": "27",
    "$gp": "28",
    "$sp": "29",
    "$fp": "30",
    "$ra": "31",
};

var instructionSet = {
    "add": {
        "op_code" : "000000",
        "typer" : "R",
        "funct": "100000"
    },
    "addi": {
        "op_code": "001000",
        "typer": "I",
        "funct": "x"
    },
    "and": {
        "op_code": "000000",
        "typer": "R",
        "funct": "100100"
    },
    "beq": {
        "op_code": "000100",
        "typer": "I",
        "funct": "x"
    },
    "lw": {
        "op_code": "100011",
        "typer": "I",
        "funct": "x"
    },
    "or": {
        "op_code": "000000",
        "typer": "R",
        "funct": "100101"
    },
    "slt": {
        "op_code": "000000",
        "typer": "R",
        "funct": "101010"
    },
    "sw": {
        "op_code": "101011",
        "typer": "I",
        "funct": "x"
    },
    "sub": {
        "op_code": "000000",
        "typer": "R",
        "funct": "100010"
    }
};

// globals
var machCode = "";

function mipsProcess() {

    document.getElementById("results").innerHTML = "";
    var lines = document.getElementById("asmCode").value.split('\n');
    var tempLines = lines;

    for(var i=0;i < lines.length;i++)
        lines[i] = lines[i].replace(/,/g,'').trim().split(' ');

    // locals
    var rs;
    var rt;
    var rd;
    var imm;
    var off_sour;
    var offset;
    var PC = 0;

    var t = document.createElement("table");

    for(var l=0;l < lines.length;l++) {
        for(var i in instructionSet) {
            if(i == lines[l][0]) {
                machCode += instructionSet[i]["op_code"];
                switch(instructionSet[i]["typer"]) {
                    case "R":
                        rs = lines[l][2];
                        rt = lines[l][3];
                        rd = lines[l][1];
                        formatRegs(rs, rt, rd);
                        machCode += "00000" + instructionSet[i]["funct"];
                        break;
                    case "I":
                        
                        // check if LW or SW
                        if(machCode == "100011" || machCode == "101011") {
                            off_sour = lines[l][2].replace(')','').split('(');
                            offset = off_sour[0];
                            rs = off_sour[1];
                            rd = "$0";
                            rt = lines[l][1];                                                      
                        }
                        // check if branch
                        else if(machCode == "000100") {
                            rt = lines[l][2];
                            rs = lines[l][1];
                            offset = lines[l][3];
                            rd = "$0";
                        }
                        else {
                             
                            rs = lines[l][2];
                            offset = lines[l][3];
                            rd = "$0";
                        }
                        formatRegs(rs, rt, rd, offset);
                        break;
                }

                // initiate the elements for the table data
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                // format the hex code by converting each 4bit block
                var hexCode = "0x";
                for(var p=0;p<32;p+=4)
                    hexCode += parseInt(machCode.substring(p,p+4),2).toString(16);
                
                // validate that the input was correct by checking if NaN is in the output
                if(hexCode.indexOf("NaN") != -1) {
                    hexCode = "Error reading input.";
                    td2.setAttribute("style", "color: red;");
                }

                // fill the table data
                var r = document.getElementById("results");
                td1.innerHTML = tempLines[l].join(",").replace(/,/,' ').replace(/,/g, ', ');
                td2.innerHTML = hexCode;
                td1.setAttribute("align", "left");
                td2.setAttribute("align", "right");

                tr.appendChild(td1);
                tr.appendChild(td2);
                r.appendChild(tr);

                // increment the program counter and clear the machine code string
                PC += 1;
                machCode = "";
            }
        }
    }
};

// format the registers so they are all padded for 5 bits
function formatRegs(rs, rt, rd, offset) {

    // format the register numbers by padding with 0's
    var rsForm = parseInt(regSetMips[rs],10).toString(2);
    var rtForm = parseInt(regSetMips[rt],10).toString(2);
    var rdForm = parseInt(regSetMips[rd],10).toString(2);

    var offSetForm;
    // array of the binary registers to cycle through them
    var a = [rsForm, rtForm, rdForm];
    var padLen;

    // check if the instruction is I-type
    if(rdForm == "0") {
        // cycle through the array rs, rt (since their is no rd)
        for(var i=0;i<a.length-1;i++) {
            // get the length of how many 0's to pad with
            padLen = 5-a[i].length;
            // concat the code
            machCode += Array(padLen+1).join("0") + a[i];
        }
        // check the offset to see if its a branch or jump
        if(isNaN(offset)) {

        }
        else {
            // get the binary offset and then pad it with 0's
            offSetForm = parseInt(offset,10).toString(2);
            machCode += Array(17-offSetForm.length).join("0") + offSetForm;
        }
    }
    else {
        for(var i=0;i<a.length;i++) {
            padLen = 5 - a[i].length;
            machCode += Array(padLen+1).join("0") + a[i];
        }
    }
};
