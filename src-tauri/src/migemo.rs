use rustmigemo::migemo::compact_dictionary::CompactDictionary;
use rustmigemo::migemo::query::query;
use rustmigemo::migemo::regex_generator::RegexOperator;

pub struct Migemo {
    dict: CompactDictionary,
    op: RegexOperator,
}

impl Migemo {
    pub fn new() -> Self {
        let dictbytes = include_bytes!("../assets/yet-another-migemo-dict/migemo-compact-dict");
        let dict = CompactDictionary::new(&dictbytes.to_vec());
        let op = RegexOperator::Default;

        Migemo {
            dict,
            op,
        }
    }

    pub fn get_migemo(&self, word: String) -> String {
        log::info!("before migemo: word='{}'", word);
        let re = query(word.to_string(), &self.dict, &self.op);
        log::info!("after migemo: word='{}' re='{}'", word, re);
        return re;
    }
}
