-- ============================================================
-- Sistema Financeiro Pessoal e Controle de Empréstimos
-- Script de criação do banco de dados
-- Banco: MySQL 8.0+
-- Charset: utf8mb4 (suporte completo a Unicode e emojis)
-- ============================================================

-- CREATE DATABASE IF NOT EXISTS sistema_financeiro
--   CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;

USE sistema_financeiro;

-- ============================================================
-- TABELA: users
-- Armazena os usuários do sistema (quem utiliza a aplicação).
-- Um usuário é o dono de todas as suas receitas, despesas,
-- clientes e empréstimos.
-- ============================================================
CREATE TABLE users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT  COMMENT 'Identificador único do usuário',
  name          VARCHAR(100)    NOT NULL                 COMMENT 'Nome completo do usuário',
  email         VARCHAR(150)    NOT NULL                 COMMENT 'E-mail usado para login, deve ser único',
  password_hash VARCHAR(255)    NOT NULL                 COMMENT 'Senha criptografada com bcrypt',
  is_active     TINYINT(1)      NOT NULL DEFAULT 1       COMMENT '1 = ativo, 0 = inativo/bloqueado',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP  COMMENT 'Data de criação do registro',
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP         COMMENT 'Data da última atualização',

  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB COMMENT='Usuários do sistema';

-- Índice para buscas por e-mail (login)
CREATE INDEX idx_users_email ON users (email);


-- ============================================================
-- TABELA: expense_categories
-- Categorias para classificação de despesas.
-- Ex: Alimentação, Transporte, Saúde, Lazer, etc.
-- Cada usuário pode ter suas próprias categorias.
-- ============================================================
CREATE TABLE expense_categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT  COMMENT 'Identificador único da categoria',
  user_id     INT UNSIGNED  NOT NULL                 COMMENT 'FK: usuário dono desta categoria',
  name        VARCHAR(80)   NOT NULL                 COMMENT 'Nome da categoria (ex: Alimentação)',
  color       VARCHAR(7)    NULL     DEFAULT '#607D8B' COMMENT 'Cor em hexadecimal para exibição no dashboard',
  icon        VARCHAR(50)   NULL                     COMMENT 'Nome do ícone Material (ex: restaurant)',
  is_active   TINYINT(1)    NOT NULL DEFAULT 1       COMMENT '1 = ativa, 0 = inativa',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_expense_categories PRIMARY KEY (id),
  CONSTRAINT fk_expense_categories_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Categorias de despesas por usuário';

CREATE INDEX idx_expense_categories_user ON expense_categories (user_id);


-- ============================================================
-- TABELA: incomes
-- Receitas financeiras pessoais do usuário.
-- Ex: salário, freelance, aluguel recebido, dividendos, etc.
-- ============================================================
CREATE TABLE incomes (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT  COMMENT 'Identificador único da receita',
  user_id      INT UNSIGNED    NOT NULL                 COMMENT 'FK: usuário dono desta receita',
  description  VARCHAR(200)    NOT NULL                 COMMENT 'Descrição da receita (ex: Salário Junho)',
  amount       DECIMAL(15,2)   NOT NULL                 COMMENT 'Valor da receita em reais',
  received_at  DATE            NOT NULL                 COMMENT 'Data em que a receita foi ou será recebida',
  is_recurring TINYINT(1)      NOT NULL DEFAULT 0       COMMENT '1 = receita recorrente mensal, 0 = pontual',
  notes        TEXT            NULL                     COMMENT 'Observações adicionais',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_incomes PRIMARY KEY (id),
  CONSTRAINT fk_incomes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- Valor não pode ser negativo ou zero
  CONSTRAINT chk_incomes_amount CHECK (amount > 0)
) ENGINE=InnoDB COMMENT='Receitas financeiras pessoais';

-- Índices para relatórios mensais (filtros por usuário + data)
CREATE INDEX idx_incomes_user_date ON incomes (user_id, received_at);
CREATE INDEX idx_incomes_received_at ON incomes (received_at);


-- ============================================================
-- TABELA: expenses
-- Despesas financeiras pessoais do usuário.
-- Pode ser fixa (aluguel) ou variável (supermercado).
-- O campo is_fixed distingue despesas recorrentes das pontuais.
-- ============================================================
CREATE TABLE expenses (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT  COMMENT 'Identificador único da despesa',
  user_id     INT UNSIGNED    NOT NULL                 COMMENT 'FK: usuário dono desta despesa',
  category_id INT UNSIGNED    NULL                     COMMENT 'FK: categoria da despesa (nullable)',
  description VARCHAR(200)    NOT NULL                 COMMENT 'Descrição da despesa (ex: Conta de luz)',
  amount      DECIMAL(15,2)   NOT NULL                 COMMENT 'Valor da despesa em reais',
  due_date    DATE            NOT NULL                 COMMENT 'Data de vencimento ou pagamento',
  paid_at     DATE            NULL                     COMMENT 'Data do pagamento efetivo (null = não pago)',
  is_fixed    TINYINT(1)      NOT NULL DEFAULT 0       COMMENT '1 = despesa fixa recorrente, 0 = variável',
  is_paid     TINYINT(1)      NOT NULL DEFAULT 0       COMMENT '1 = paga, 0 = em aberto',
  notes       TEXT            NULL                     COMMENT 'Observações adicionais',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_expenses PRIMARY KEY (id),
  CONSTRAINT fk_expenses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_expenses_category
    FOREIGN KEY (category_id) REFERENCES expense_categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT chk_expenses_amount CHECK (amount > 0)
) ENGINE=InnoDB COMMENT='Despesas financeiras pessoais';

CREATE INDEX idx_expenses_user_date  ON expenses (user_id, due_date);
CREATE INDEX idx_expenses_due_date   ON expenses (due_date);
CREATE INDEX idx_expenses_category   ON expenses (category_id);
CREATE INDEX idx_expenses_is_paid    ON expenses (is_paid);


-- ============================================================
-- TABELA: clients
-- Pessoas físicas que tomaram empréstimos do usuário.
-- Cada cliente pertence a um usuário do sistema.
-- ============================================================
CREATE TABLE clients (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT  COMMENT 'Identificador único do cliente',
  user_id    INT UNSIGNED  NOT NULL                 COMMENT 'FK: usuário (credor) dono deste cliente',
  name       VARCHAR(100)  NOT NULL                 COMMENT 'Nome completo do cliente',
  cpf        VARCHAR(14)   NULL                     COMMENT 'CPF no formato 000.000.000-00 (único por usuário)',
  phone      VARCHAR(20)   NULL                     COMMENT 'Telefone principal (com DDD)',
  email      VARCHAR(150)  NULL                     COMMENT 'E-mail do cliente',
  address    VARCHAR(300)  NULL                     COMMENT 'Endereço completo',
  city       VARCHAR(100)  NULL                     COMMENT 'Cidade',
  state      CHAR(2)       NULL                     COMMENT 'UF (ex: SP, RJ)',
  status     ENUM('active','inactive','defaulter')
             NOT NULL DEFAULT 'active'              COMMENT 'active=ativo, inactive=inativo, defaulter=inadimplente',
  notes      TEXT          NULL                     COMMENT 'Observações sobre o cliente',
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_clients PRIMARY KEY (id),
  CONSTRAINT fk_clients_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- CPF único por usuário (dois usuários diferentes podem ter o mesmo cliente)
  CONSTRAINT uq_clients_cpf_user UNIQUE (user_id, cpf)
) ENGINE=InnoDB COMMENT='Clientes tomadores de empréstimo';

CREATE INDEX idx_clients_user   ON clients (user_id);
CREATE INDEX idx_clients_status ON clients (status);
CREATE INDEX idx_clients_name   ON clients (name);


-- ============================================================
-- TABELA: loans
-- Empréstimos concedidos pelo usuário a um cliente.
-- Ao criar um empréstimo, as parcelas são geradas
-- automaticamente na tabela installments (via application).
-- ============================================================
CREATE TABLE loans (
  id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT  COMMENT 'Identificador único do empréstimo',
  user_id             INT UNSIGNED    NOT NULL                 COMMENT 'FK: usuário credor',
  client_id           INT UNSIGNED    NOT NULL                 COMMENT 'FK: cliente devedor',
  principal_amount    DECIMAL(15,2)   NOT NULL                 COMMENT 'Valor principal emprestado (sem juros)',
  interest_rate       DECIMAL(8,4)    NOT NULL DEFAULT 0.0000  COMMENT 'Taxa de juros mensal em % (ex: 5.00 = 5% ao mês)',
  total_amount        DECIMAL(15,2)   NOT NULL                 COMMENT 'Valor total a receber (principal + juros)',
  installments_count  SMALLINT        NOT NULL                 COMMENT 'Número total de parcelas',
  start_date          DATE            NOT NULL                 COMMENT 'Data de início / concessão do empréstimo',
  first_due_date      DATE            NOT NULL                 COMMENT 'Data de vencimento da primeira parcela',
  status              ENUM('active','paid','defaulted','cancelled')
                      NOT NULL DEFAULT 'active'               COMMENT 'active=ativo, paid=quitado, defaulted=inadimplente, cancelled=cancelado',
  notes               TEXT            NULL                     COMMENT 'Observações sobre o empréstimo',
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_loans PRIMARY KEY (id),
  CONSTRAINT fk_loans_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_loans_client
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT chk_loans_principal    CHECK (principal_amount > 0),
  CONSTRAINT chk_loans_installments CHECK (installments_count > 0),
  CONSTRAINT chk_loans_interest     CHECK (interest_rate >= 0)
) ENGINE=InnoDB COMMENT='Empréstimos concedidos aos clientes';

CREATE INDEX idx_loans_user     ON loans (user_id);
CREATE INDEX idx_loans_client   ON loans (client_id);
CREATE INDEX idx_loans_status   ON loans (status);
CREATE INDEX idx_loans_start_date ON loans (start_date);


-- ============================================================
-- TABELA: installments
-- Parcelas geradas automaticamente ao criar um empréstimo.
-- Cada parcela representa uma obrigação de pagamento mensal.
-- ============================================================
CREATE TABLE installments (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT  COMMENT 'Identificador único da parcela',
  loan_id          INT UNSIGNED    NOT NULL                 COMMENT 'FK: empréstimo ao qual pertence esta parcela',
  installment_number SMALLINT      NOT NULL                 COMMENT 'Número sequencial da parcela (1, 2, 3...)',
  due_date         DATE            NOT NULL                 COMMENT 'Data de vencimento desta parcela',
  amount           DECIMAL(15,2)   NOT NULL                 COMMENT 'Valor desta parcela',
  paid_amount      DECIMAL(15,2)   NOT NULL DEFAULT 0.00    COMMENT 'Valor já pago nesta parcela (pode ser parcial)',
  status           ENUM('pending','partial','paid','overdue')
                   NOT NULL DEFAULT 'pending'               COMMENT 'pending=pendente, partial=pago parcialmente, paid=quitado, overdue=vencido',
  paid_at          DATE            NULL                     COMMENT 'Data do pagamento completo (null = não quitado)',
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_installments PRIMARY KEY (id),
  CONSTRAINT fk_installments_loan
    FOREIGN KEY (loan_id) REFERENCES loans(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- Combinação única: um empréstimo não pode ter duas parcelas com o mesmo número
  CONSTRAINT uq_installment_loan_number UNIQUE (loan_id, installment_number),

  CONSTRAINT chk_installments_amount CHECK (amount > 0),
  CONSTRAINT chk_installments_paid   CHECK (paid_amount >= 0)
) ENGINE=InnoDB COMMENT='Parcelas dos empréstimos';

CREATE INDEX idx_installments_loan      ON installments (loan_id);
CREATE INDEX idx_installments_due_date  ON installments (due_date);
CREATE INDEX idx_installments_status    ON installments (status);
-- Índice composto para buscar parcelas vencidas de um usuário via JOIN
CREATE INDEX idx_installments_status_due ON installments (status, due_date);


-- ============================================================
-- TABELA: payments
-- Registra cada pagamento efetuado em uma parcela.
-- Uma parcela pode receber múltiplos pagamentos parciais
-- até ser totalmente quitada.
-- ============================================================
CREATE TABLE payments (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT  COMMENT 'Identificador único do pagamento',
  installment_id  INT UNSIGNED    NOT NULL                 COMMENT 'FK: parcela que está sendo paga',
  amount_paid     DECIMAL(15,2)   NOT NULL                 COMMENT 'Valor pago nesta transação',
  paid_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora do pagamento',
  payment_method  ENUM('cash','pix','bank_transfer','other')
                  NOT NULL DEFAULT 'cash'                  COMMENT 'Forma de pagamento utilizada',
  notes           TEXT            NULL                     COMMENT 'Observações sobre este pagamento',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_payments PRIMARY KEY (id),
  CONSTRAINT fk_payments_installment
    FOREIGN KEY (installment_id) REFERENCES installments(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT chk_payments_amount CHECK (amount_paid > 0)
) ENGINE=InnoDB COMMENT='Histórico de pagamentos por parcela';

CREATE INDEX idx_payments_installment ON payments (installment_id);
CREATE INDEX idx_payments_paid_at     ON payments (paid_at);