import { PublicKey } from "@solana/web3.js"

export async function extractSolanaAddress(text) {
    const base58chars = '1-9A-HJ-NP-Za-km-z'; // набор символов для base58

    const regex = new RegExp(`[${base58chars}]{43,44}`, 'g'); // выражение на проверку

    const keywords = ['pump','bonk','moon','boop']; // ланчпады солановских токенов
    const KeywordsRegex = keywords.map(word => // проверяем что содержит
        new RegExp(word + '$', 'i')
    ); 

    const matches = text.match(regex);
    if (!matches) return []; // проверяем есть ли вообще необходимые вхождения

    const uniqueMatches = [...new Set(matches)];
    const validMatches = [];

    for(const addr of uniqueMatches){
        if(KeywordsRegex.some( r => r.test(addr))){
            try{
                new PublicKey(addr);
                validMatches.push(addr);
            }catch(e){
                continue;
            }
        }
        
    }

    return validMatches;

}

export async function formatPhoneNumber(rawNum) {
    rawNum = rawNum.trim();

    let cleaned = rawNum.replace(/[^\d+]/g, '');

    if(cleaned.startsWith("+")){
        const digitsOnly = cleaned.slice(1).replace(/\D/g, '');
        if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
            return '+' + digitsOnly;
        }
        else{
            return false;
        }
    }

    let digits = cleaned.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 15){
        return false;
    }

    if (digits.length === 10){
        digits = '7' + digits;
    }
    else if(digits.length === 11 && digits.startsWith('8')){
        digits = '7' + digits.slice(1);     
    }

    if(digits.length === 11 && digits.startsWith('7')){
        return "+" + digits;
    }

    return false;
}