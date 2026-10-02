(async()=>{
 const form=document.querySelector('#web-quote-form');
 const assert=(condition,message)=>{if(!condition)throw Error(message)};
 form.requestSubmit();
 assert(document.querySelector('#web-brief').hidden,'Invalid form passed');
 form.elements.name.value='Preview Test';form.elements.email.value='preview@example.com';form.elements.company.value='Example';form.elements.interest.value='Ecommerce stores';form.elements.workflow.value='We need a catalogue, cart and checkout for our new store.';form.elements.budget.value='INR 50000';form.elements.consent.checked=true;
 form.requestSubmit();await new Promise(r=>setTimeout(r,50));
 assert(!document.querySelector('#web-brief').hidden,'Brief missing');
 assert(document.querySelector('#web-send').href.startsWith('mailto:harshitpandey3519@gmail.com'),'Destination incorrect');
 assert(document.querySelector('#web-brief-text').textContent.includes('INR 50000'),'Budget missing');
 assert(document.querySelector('#web-brief').textContent.includes('Nothing has been sent'),'False submission message');
 document.querySelector('#web-edit').click();assert(!form.hidden,'Edit failed');
 document.querySelector('#web-motion').click();assert(document.querySelector('#web-motion').getAttribute('aria-pressed')==='true','Pause failed');
 return JSON.stringify({validation:'pass',brief:'pass',destination:'verified email',edit:'pass',pause:'pass'});
})()
