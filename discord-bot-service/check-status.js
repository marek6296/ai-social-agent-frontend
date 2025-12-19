// Jednoduchý skript na kontrolu stavu service a botov
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  console.log('🔍 Kontrolujem stav Discord botov...\n');
  
  try {
    const { data: bots, error } = await supabase
      .from('discord_bots')
      .select('id, bot_name, status, bot_type, created_at');
    
    if (error) {
      console.error('❌ Chyba pri načítaní botov:', error.message);
      return;
    }
    
    if (!bots || bots.length === 0) {
      console.log('ℹ️  Nenašli sa žiadni boti v databáze.');
      return;
    }
    
    console.log(`📋 Nájdených ${bots.length} bot(ov):\n`);
    
    bots.forEach((bot, index) => {
      const statusEmoji = bot.status === 'active' ? '✅' : bot.status === 'error' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${bot.bot_name}`);
      console.log(`   Status: ${statusEmoji} ${bot.status}`);
      console.log(`   Typ: ${bot.bot_type}`);
      console.log(`   ID: ${bot.id}`);
      console.log('');
    });
    
    const activeCount = bots.filter(b => b.status === 'active').length;
    console.log(`\n📊 Súhrn:`);
    console.log(`   Aktívnych: ${activeCount}/${bots.length}`);
    console.log(`   Neaktívnych: ${bots.length - activeCount}/${bots.length}`);
    
    if (activeCount > 0) {
      console.log('\n✅ Service by mal automaticky načítať aktívnych botov.');
    } else {
      console.log('\n⚠️  Žiadni boti nemajú status "active".');
      console.log('   Aktivuj bota cez web rozhranie (tlačidlo "Aktivovať bota").');
    }
    
  } catch (error) {
    console.error('❌ Neočakávaná chyba:', error.message);
  }
}

checkStatus();


